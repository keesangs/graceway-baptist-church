import { Worker } from "node:worker_threads";
import { createRequire } from "node:module";
import { Readable } from "node:stream";
import { performance } from "node:perf_hooks";
import { createAudioResource, StreamType } from "@discordjs/voice";

export const DISCORD_FRAME_BYTES = 960 * 2 * 2;
export const DISCORD_FRAME_MS = 20;

export const SENTENCE_BOUNDARY = Object.freeze({ fadeInMs: 6, fadeOutMs: 12, encoderTailMs: 60 });

/** Taper only the edges, without trimming speech, changing the middle, or
 * mutating the provider/conversion buffer. Identical stereo gains preserve
 * balance. Raised-cosine ramps meet digital silence with zero slope. */
export function smoothDiscordSentencePcm(pcm: Buffer): Buffer {
  if (!pcm.length || pcm.length % 4 !== 0) throw new Error("Discord PCM must contain complete 48 kHz stereo samples");
  const result = Buffer.from(pcm);
  const frames = pcm.length / 4;
  if (frames === 1) { result.fill(0); return result; }
  // Short buffers get non-overlapping ramps instead of being read out of bounds.
  const fadeInFrames = Math.min(Math.round(48 * SENTENCE_BOUNDARY.fadeInMs), Math.floor(frames / 2));
  const fadeOutFrames = Math.min(Math.round(48 * SENTENCE_BOUNDARY.fadeOutMs), Math.floor(frames / 2));
  for (let index = 0; index < fadeInFrames; index++) {
    const gain = fadeInFrames === 1 ? 0 : (1 - Math.cos(Math.PI * index / (fadeInFrames - 1))) / 2;
    for (let channel = 0; channel < 2; channel++) {
      const offset = index * 4 + channel * 2;
      result.writeInt16LE(Math.round(pcm.readInt16LE(offset) * gain), offset);
    }
  }
  for (let index = 0; index < fadeOutFrames; index++) {
    const gain = fadeOutFrames === 1 ? 0 : (1 + Math.cos(Math.PI * index / (fadeOutFrames - 1))) / 2;
    for (let channel = 0; channel < 2; channel++) {
      const offset = (frames - fadeOutFrames + index) * 4 + channel * 2;
      result.writeInt16LE(Math.round(pcm.readInt16LE(offset) * gain), offset);
    }
  }
  return result;
}

export type BufferedOpusAudio = {
  packets: Buffer[];
  codec: string;
  encodingMs: number;
  audioDurationMs: number;
  boundarySmoothing?: typeof SENTENCE_BOUNDARY;
};

// Inline source is intentional: esbuild's single-file production bundle does
// not copy separate worker files. Resolve the installed codec in the parent.
const encoderWorker = `
const { parentPort, workerData } = require('node:worker_threads');
const Opus = require(workerData.codecPath);
let encoder;
try {
  const pcm = Buffer.from(workerData.pcm);
  encoder = new Opus(48000, 2, Opus.Application.VOIP);
  encoder.encoderCTL(4002, 64000); // bitrate
  encoder.encoderCTL(4010, 5); // complexity
  encoder.encoderCTL(4012, 1); // in-band FEC
  encoder.encoderCTL(4014, 5); // expected loss percentage, not measured loss
  const packets = [];
  const started = performance.now();
  // Short leading silence gives the receiver time to establish playout.
  for (let i = 0; i < 5; i++) packets.push(Buffer.from(encoder.encode(Buffer.alloc(3840), 960)));
  for (let offset = 0; offset < pcm.length; offset += 3840) {
    const frame = Buffer.alloc(3840);
    pcm.copy(frame, 0, offset, Math.min(offset + 3840, pcm.length));
    packets.push(Buffer.from(encoder.encode(frame, 960)));
  }
  // Flush this encoder's lookahead/predictor through real encoded silence
  // before Discord's canonical silence packets and the next sentence's encoder.
  // This keeps the final sound from being cut off at a partial packet boundary.
  for (let i = 0; i < workerData.tailFrames; i++) packets.push(Buffer.from(encoder.encode(Buffer.alloc(3840), 960)));
  parentPort.postMessage({ packets, encodingMs: performance.now() - started });
} catch (error) {
  parentPort.postMessage({ error: error instanceof Error ? error.message : String(error) });
} finally {
  if (encoder) encoder.delete();
}
`;

export function encodeDiscordOpus(pcm: Buffer): Promise<BufferedOpusAudio> {
  if (!pcm.length || pcm.length % 4 !== 0) return Promise.reject(new Error("Discord PCM must contain complete 48 kHz stereo samples"));
  if (pcm.length > 48_000 * 4 * 120) return Promise.reject(new Error("Discord sentence audio exceeds 120 seconds"));
  const smoothed = smoothDiscordSentencePcm(pcm);
  const codecPath = createRequire(import.meta.url).resolve("opusscript");
  return new Promise((resolve, reject) => {
    // This self-contained CommonJS worker must not inherit TS loaders or
    // --input-type=module from the parent process.
    const worker = new Worker(encoderWorker, { eval: true, execArgv: [], workerData: {
      pcm: smoothed, codecPath, tailFrames: SENTENCE_BOUNDARY.encoderTailMs / DISCORD_FRAME_MS,
    } });
    const timeout = setTimeout(() => finish(new Error("Opus preparation timed out")), 30_000);
    let settled = false;
    function finish(error?: Error, result?: BufferedOpusAudio) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      void worker.terminate();
      if (error) reject(error);
      else resolve(result!);
    }
    worker.once("message", (message: { error?: string; packets: Uint8Array[]; encodingMs: number }) => {
      if (message.error) return finish(new Error(message.error));
      const packets = message.packets.map(packet => Buffer.from(packet));
      if (!packets.length || packets.some(packet => !packet.length)) return finish(new Error("Opus encoder returned empty packets"));
      finish(undefined, { packets, encodingMs: Math.round(message.encodingMs), codec: "opusscript-worker", audioDurationMs: pcm.length / 192,
        boundarySmoothing: SENTENCE_BOUNDARY });
    });
    worker.once("error", error => finish(error));
    worker.once("exit", code => { if (!settled) finish(new Error(`Opus worker exited before returning audio (${code})`)); });
  });
}

export type PlaybackDiagnostics = {
  codec: string;
  mode: "buffered-opus";
  packetCount: number;
  audioDurationMs: number;
  encodingMs: number;
  packetReads: number;
  underflowReads: number;
  maxReadGapMs: number;
  wallPlaybackMs: number;
  connectionInterruptions: number;
  boundarySmoothing?: typeof SENTENCE_BOUNDARY;
};

export function createBufferedOpusResource(audio: BufferedOpusAudio) {
  const resource = createAudioResource(Readable.from(audio.packets, {
    objectMode: true,
    highWaterMark: audio.packets.length,
  }), { inputType: StreamType.Opus, silencePaddingFrames: 5 });
  const diagnostics: PlaybackDiagnostics = {
    codec: audio.codec, mode: "buffered-opus", packetCount: audio.packets.length,
    audioDurationMs: Math.round(audio.audioDurationMs), encodingMs: audio.encodingMs,
    packetReads: 0, underflowReads: 0, maxReadGapMs: 0, wallPlaybackMs: 0, connectionInterruptions: 0,
    boundarySmoothing: audio.boundarySmoothing,
  };
  let previousReadAt: number | undefined;
  const originalRead = resource.read.bind(resource);
  resource.read = () => {
    const now = performance.now();
    const packet = originalRead();
    if (packet) {
      if (previousReadAt !== undefined) diagnostics.maxReadGapMs = Math.max(diagnostics.maxReadGapMs, Math.round(now - previousReadAt));
      previousReadAt = now;
      diagnostics.packetReads += 1;
    } else if (!resource.ended) {
      diagnostics.underflowReads += 1;
    }
    return packet;
  };
  return { resource, diagnostics };
}

export function discordPcmToWav(pcm: Buffer) {
  const wav = Buffer.alloc(44 + pcm.length);
  wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(48_000, 24); wav.writeUInt32LE(192_000, 28);
  wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(pcm.length, 40);
  pcm.copy(wav, 44);
  return wav;
}
