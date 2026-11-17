import { writeFile } from "node:fs/promises";

const endpoint = process.env.QWEN_TTS_REMOTE_URL ?? "https://api.deepinfra.com/v1/inference/Qwen/Qwen3-TTS";
const apiKey = process.env.DEEPINFRA_API_KEY;
const outputPath = process.env.DEEPINFRA_TEST_OUTPUT ?? "/tmp/graceway-deepinfra-tts-test.wav";

if (!apiKey) {
  throw new Error("DEEPINFRA_API_KEY is not configured as a server secret");
}

const text = process.env.DEEPINFRA_TEST_TEXT ?? "Welcome to Graceway Baptist Church.";
const startedAt = performance.now();
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), Number(process.env.QWEN_TTS_REMOTE_TIMEOUT_MS ?? 30_000));

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "audio/wav, audio/pcm, application/octet-stream, application/json",
    },
    body: JSON.stringify({
      input: text,
      voice: process.env.QWEN_TTS_SPEAKER ?? "Aiden",
      language: "English",
      instruct: process.env.QWEN_TTS_INSTRUCT ?? "Speak clearly and warmly, suitable for a church announcement.",
      response_format: process.env.QWEN_TTS_REMOTE_FORMAT ?? "wav",
    }),
    signal: controller.signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepInfra HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  let audio: Buffer;
  if (contentType.includes("audio/") || contentType.includes("application/octet-stream")) {
    audio = Buffer.from(await response.arrayBuffer());
  } else {
    const payload = (await response.json()) as Record<string, unknown>;
    const encoded = [payload.audio, payload.wav, payload.audio_base64, payload.data, payload.output].find(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
    if (!encoded) throw new Error(String(payload.error ?? payload.detail ?? "DeepInfra returned no audio"));
    audio = Buffer.from(encoded.includes(",") ? encoded.slice(encoded.indexOf(",") + 1) : encoded, "base64");
  }

  if (!audio.length) throw new Error("DeepInfra returned empty audio");
  await writeFile(outputPath, audio);
  console.log(JSON.stringify({
    ok: true,
    provider: "DeepInfra",
    model: "Qwen3-TTS",
    characters: text.length,
    contentType,
    bytes: audio.length,
    latencyMs: Math.round(performance.now() - startedAt),
    outputPath,
  }, null, 2));
} finally {
  clearTimeout(timeout);
}
