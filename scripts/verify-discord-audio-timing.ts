// Usage: pnpm exec tsx scripts/verify-discord-audio-timing.ts /path/to/tts.wav
// Isolated player only: no bot token, gateway login, microphone, or UDP socket.
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { performance } from "node:perf_hooks";
import { AudioPlayerStatus, NoSubscriberBehavior, StreamType, createAudioPlayer, createAudioResource, entersState } from "@discordjs/voice";
import { convertAudioForDiscord } from "../server/discordTts";
import { createBufferedOpusResource, encodeDiscordOpus } from "../server/discordAudio";

async function probe(resource: ReturnType<typeof createAudioResource>, mode: string) {
  const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
  const read = resource.read.bind(resource);
  const times: number[] = [];
  resource.read = () => { const packet = read(); if (packet) times.push(performance.now()); return packet; };
  const start = performance.now();
  player.play(resource);
  try {
    await entersState(player, AudioPlayerStatus.Playing, 5000);
    await entersState(player, AudioPlayerStatus.Idle, 120_000);
    const gaps = times.slice(1).map((time, index) => time - times[index]);
    return {
      mode, firstReadMs: Math.round(times[0] - start), wallMs: Math.round(performance.now() - start),
      packetReads: times.length, maxGapMs: Math.round(Math.max(...gaps)),
      gapsUnder10Ms: gaps.filter(gap => gap < 10).length,
      gapsOver40Ms: gaps.filter(gap => gap > 40).length,
    };
  } finally { player.stop(true); }
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Pass a saved TTS WAV file path");
  const pcm = await convertAudioForDiscord(await readFile(path), "wav");
  // Native encoder availability affects the Raw comparison, so results are
  // local observations, not evidence of production or recipient packet loss.
  const raw = await probe(createAudioResource(Readable.from([pcm]), { inputType: StreamType.Raw }), "raw-on-player-thread");
  const audio = await encodeDiscordOpus(pcm);
  const { resource, diagnostics } = createBufferedOpusResource(audio);
  const buffered = await probe(resource, "buffered-opus-worker");
  console.log(JSON.stringify({ durationMs: Math.round(pcm.length / 192), raw, buffered, diagnostics, listenerQualityVerified: false }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
