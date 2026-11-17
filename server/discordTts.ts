import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const DEFAULT_REMOTE_URL = "https://api.deepinfra.com/v1/inference/Qwen/Qwen3-TTS";
const DEFAULT_TIMEOUT_MS = 30_000;
const SOURCE_RATE = 24_000;

export type TtsEngine = "deepinfra-qwen" | "local-fallback";
export type TtsAudioFormat = "wav" | "pcm_s16le_24khz_mono";
type TtsRuntimeState = "ready" | "synthesizing" | "fallback" | "error";

export type DiscordTtsSettings = {
  speaker: string;
  instruct: string;
  speed: number;
};

export type DiscordTtsStatus = {
  remoteEnabled: boolean;
  apiKeyConfigured: boolean;
  endpoint: string;
  state: TtsRuntimeState;
  currentEngine: TtsEngine | null;
  lastEngine: TtsEngine | null;
  lastLatencyMs: number | null;
  lastRequestAt: string | null;
  lastError: string | null;
  requestCount: number;
  completedCount: number;
  failedCount: number;
  settings: DiscordTtsSettings;
};

const defaultSettings: DiscordTtsSettings = {
  speaker: process.env.QWEN_TTS_SPEAKER ?? "Aiden",
  instruct: process.env.QWEN_TTS_INSTRUCT ?? "Speak clearly and warmly, suitable for a church announcement.",
  speed: 1,
};

let runtimeApiKey: string | undefined;
let remoteEnabled = process.env.DEEPINFRA_TTS_ENABLED !== "false";
let state: TtsRuntimeState = "ready";
let currentEngine: TtsEngine | null = null;
let lastEngine: TtsEngine | null = null;
let lastLatencyMs: number | null = null;
let lastRequestAt: string | null = null;
let lastError: string | null = null;
let requestCount = 0;
let completedCount = 0;
let failedCount = 0;
let settings: DiscordTtsSettings = { ...defaultSettings };

function getApiKey() {
  return runtimeApiKey?.trim() || process.env.DEEPINFRA_API_KEY?.trim() || "";
}

function getRemoteUrl() {
  return process.env.QWEN_TTS_REMOTE_URL?.trim() || DEFAULT_REMOTE_URL;
}

function getTimeoutMs() {
  const parsed = Number(process.env.QWEN_TTS_REMOTE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed >= 1_000 ? parsed : DEFAULT_TIMEOUT_MS;
}

function publicEndpoint(url: string) {
  try {
    return new URL(url).origin + new URL(url).pathname;
  } catch {
    return DEFAULT_REMOTE_URL;
  }
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function parseDeepInfraError(payload: unknown) {
  if (!payload || typeof payload !== "object") return "DeepInfra returned an unknown error";
  const record = payload as { error?: string | { message?: string }; detail?: string; message?: string };
  if (typeof record.error === "string") return record.error;
  if (record.error?.message) return record.error.message;
  return record.detail ?? record.message ?? "DeepInfra returned an error without details";
}

async function responseToAudio(response: Response) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("audio/") || contentType.includes("application/octet-stream")) {
    const audio = Buffer.from(await response.arrayBuffer());
    if (!audio.length) throw new Error("DeepInfra returned empty audio");
    return audio;
  }

  const payload = (await response.json()) as unknown;
  const record = payload as { audio?: unknown; wav?: unknown; audio_base64?: unknown; data?: unknown; output?: unknown };
  const encoded = [record.audio, record.wav, record.audio_base64, record.data, record.output].find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  if (!encoded) throw new Error(parseDeepInfraError(payload));
  const base64 = encoded.includes(",") ? encoded.slice(encoded.indexOf(",") + 1) : encoded;
  const audio = Buffer.from(base64, "base64");
  if (!audio.length) throw new Error("DeepInfra returned empty base64 audio");
  return audio;
}

async function synthesizeDeepInfra(text: string, currentSettings: DiscordTtsSettings) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("DEEPINFRA_API_KEY is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());
  try {
    const response = await fetch(getRemoteUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "audio/wav, audio/pcm, application/octet-stream, application/json",
      },
      body: JSON.stringify({
        input: text,
        voice: currentSettings.speaker,
        language: "English",
        instruct: currentSettings.instruct,
        response_format: process.env.QWEN_TTS_REMOTE_FORMAT ?? "wav",
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`DeepInfra HTTP ${response.status}: ${body.slice(0, 300)}`);
    }
    return responseToAudio(response);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`DeepInfra request timed out after ${getTimeoutMs()}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function runProcess(command: string, args: string[], input: Buffer | string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", fail);
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      if (code !== 0) {
        reject(new Error(stderr.length ? Buffer.concat(stderr).toString().slice(0, 300) : `${command} exited with code ${code}`));
      } else {
        resolve(Buffer.concat(stdout));
      }
    });
    child.stdin.on("error", fail);
    child.stdin.end(input);
  });
}

async function synthesizeLocalFallback(text: string, currentSettings: DiscordTtsSettings) {
  const espeak = process.env.ESPEAK_NG_PATH ?? "espeak-ng";
  const wav = await runProcess(espeak, ["-v", "en-us", "-s", String(Math.round(145 * currentSettings.speed)), "--stdin", "--stdout"], text);
  const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
  const pcm = await runProcess(ffmpeg, ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-f", "s16le", "-ar", String(SOURCE_RATE), "-ac", "1", "pipe:1"], wav);
  if (!pcm.length) throw new Error("Local fallback returned empty audio");
  return pcm;
}

function readWavPcm(audio: Buffer) {
  if (audio.length < 12 || audio.toString("ascii", 0, 4) !== "RIFF" || audio.toString("ascii", 8, 12) !== "WAVE") return null;
  let offset = 12;
  let format: { code: number; channels: number; rate: number; bits: number } | undefined;
  let data: Buffer | undefined;
  while (offset + 8 <= audio.length) {
    const id = audio.toString("ascii", offset, offset + 4);
    const size = audio.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = Math.min(start + size, audio.length);
    if (id === "fmt " && end - start >= 16) {
      format = {
        code: audio.readUInt16LE(start),
        channels: audio.readUInt16LE(start + 2),
        rate: audio.readUInt32LE(start + 4),
        bits: audio.readUInt16LE(start + 14),
      };
    } else if (id === "data") {
      data = audio.subarray(start, end);
    }
    offset = start + size + (size % 2);
  }
  if (!format || !data || !format.channels || !format.rate || ![1, 3].includes(format.code)) return null;
  if (![8, 16, 24, 32].includes(format.bits)) return null;

  const bytesPerSample = format.bits / 8;
  const frameBytes = bytesPerSample * format.channels;
  const frames = Math.floor(data.length / frameBytes);
  const mono = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < format.channels; channel += 1) {
      const position = frame * frameBytes + channel * bytesPerSample;
      let sample: number;
      if (format.code === 3 && format.bits === 32) sample = data.readFloatLE(position);
      else if (format.bits === 8) sample = (data.readUInt8(position) - 128) / 128;
      else if (format.bits === 16) sample = data.readInt16LE(position) / 32768;
      else if (format.bits === 24) {
        const value = data.readIntLE(position, 3);
        sample = value / 8388608;
      } else sample = data.readInt32LE(position) / 2147483648;
      sum += Math.max(-1, Math.min(1, sample));
    }
    mono[frame] = sum / format.channels;
  }
  return { samples: mono, rate: format.rate };
}

function rawPcm24k(audio: Buffer) {
  const samples = new Float32Array(Math.floor(audio.length / 2));
  for (let index = 0; index < samples.length; index += 1) samples[index] = audio.readInt16LE(index * 2) / 32768;
  return { samples, rate: SOURCE_RATE };
}

function resampleToDiscordPcm(input: { samples: Float32Array; rate: number }) {
  const outputFrames = Math.max(1, Math.round(input.samples.length * 48_000 / input.rate));
  const output = Buffer.allocUnsafe(outputFrames * 4);
  for (let frame = 0; frame < outputFrames; frame += 1) {
    const source = frame * input.rate / 48_000;
    const leftIndex = Math.min(input.samples.length - 1, Math.floor(source));
    const rightIndex = Math.min(input.samples.length - 1, leftIndex + 1);
    const ratio = source - leftIndex;
    const sample = Math.max(-1, Math.min(1, input.samples[leftIndex] * (1 - ratio) + input.samples[rightIndex] * ratio));
    const value = Math.round(sample * 32767);
    output.writeInt16LE(value, frame * 4);
    output.writeInt16LE(value, frame * 4 + 2);
  }
  return output;
}

function convertAudioNatively(audio: Buffer, format: TtsAudioFormat) {
  const decoded = format === "wav" ? readWavPcm(audio) : rawPcm24k(audio);
  return decoded ? resampleToDiscordPcm(decoded) : null;
}

export async function convertAudioForDiscord(audio: Buffer, format: TtsAudioFormat) {
  const native = convertAudioNatively(audio, format);
  if (native?.length) return native;
  const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
  const inputCandidates = format === "wav"
    ? [["-i", "pipe:0"], ["-f", "wav", "-i", "pipe:0"]]
    : [["-f", "s16le", "-ar", String(SOURCE_RATE), "-ac", "1", "-i", "pipe:0"]];
  let lastError: unknown;
  for (const inputArgs of inputCandidates) {
    try {
      return await runProcess(ffmpeg, ["-hide_banner", "-loglevel", "error", "-nostdin", ...inputArgs, "-f", "s16le", "-ar", "48000", "-ac", "2", "pipe:1"], audio);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Discord audio conversion failed: ${errorText(lastError)}`);
}

export function getDiscordTtsStatus(): DiscordTtsStatus {
  return {
    remoteEnabled,
    apiKeyConfigured: Boolean(getApiKey()),
    endpoint: publicEndpoint(getRemoteUrl()),
    state,
    currentEngine,
    lastEngine,
    lastLatencyMs,
    lastRequestAt,
    lastError,
    requestCount,
    completedCount,
    failedCount,
    settings: { ...settings },
  };
}

export function configureDiscordTts(input: {
  remoteEnabled?: boolean;
  apiKey?: string;
  speaker?: string;
  instruct?: string;
  speed?: number;
}) {
  if (typeof input.remoteEnabled === "boolean") remoteEnabled = input.remoteEnabled;
  if (input.apiKey?.trim()) runtimeApiKey = input.apiKey.trim();
  if (input.speaker?.trim()) settings.speaker = input.speaker.trim().slice(0, 80);
  if (input.instruct !== undefined) settings.instruct = input.instruct.trim().slice(0, 500);
  if (input.speed !== undefined) settings.speed = input.speed;
  lastError = null;
  state = "ready";
  return getDiscordTtsStatus();
}

export async function synthesizeDiscordText(text: string, requestedSettings = settings) {
  const spoken = text.replace(/https?:\/\/\S+/g, " link ").replace(/<@!?\d+>/g, " mention ").trim();
  if (!spoken) return { audio: Buffer.alloc(0), engine: null as TtsEngine | null, format: "pcm_s16le_24khz_mono" as const, latencyMs: 0 };

  requestCount += 1;
  lastRequestAt = new Date().toISOString();
  state = "synthesizing";
  currentEngine = null;
  const started = performance.now();
  let remoteError = "remote disabled";

  if (remoteEnabled) {
    try {
      const audio = await synthesizeDeepInfra(spoken, requestedSettings);
      lastLatencyMs = Math.round(performance.now() - started);
      lastEngine = "deepinfra-qwen";
      currentEngine = null;
      state = "ready";
      lastError = null;
      completedCount += 1;
      return { audio, engine: "deepinfra-qwen" as const, format: "wav" as const, latencyMs: lastLatencyMs };
    } catch (error) {
      remoteError = errorText(error);
    }
  }

  try {
    currentEngine = "local-fallback";
    const audio = await synthesizeLocalFallback(spoken, requestedSettings);
    lastLatencyMs = Math.round(performance.now() - started);
    lastEngine = "local-fallback";
    currentEngine = null;
    state = "fallback";
    lastError = remoteError === "remote disabled" ? null : `DeepInfra: ${remoteError}`;
    completedCount += 1;
    return { audio, engine: "local-fallback" as const, format: "pcm_s16le_24khz_mono" as const, latencyMs: lastLatencyMs };
  } catch (error) {
    currentEngine = null;
    state = "error";
    lastError = `DeepInfra: ${remoteError}; local fallback: ${errorText(error)}`;
    failedCount += 1;
    throw new Error(lastError);
  }
}

export function resetDiscordTtsForTests() {
  runtimeApiKey = undefined;
  remoteEnabled = process.env.DEEPINFRA_TTS_ENABLED !== "false";
  state = "ready";
  currentEngine = null;
  lastEngine = null;
  lastLatencyMs = null;
  lastRequestAt = null;
  lastError = null;
  requestCount = 0;
  completedCount = 0;
  failedCount = 0;
  settings = { ...defaultSettings };
}

export const discordTtsRequestId = () => randomUUID();
