# Graceway Baptist Church — Qwen3-TTS Production Handoff

**Document purpose:** Give a new agent or engineer enough context to continue the Graceway Baptist Church live worship Discord translation/TTS project on a machine with sufficient CPU/GPU and persistent storage.

**Last updated:** 2026-11-17

**Repository:** `https://github.com/keesangs/graceway-baptist-church.git` (the active WebDev project working copy is `/home/ubuntu/graceway-church-website`)

**Current latest checkpoint:** `e6b00b8`

---

## 1. Executive summary

The project is a React 19 + Vite + Tailwind + tRPC + Express church website with a server-side Discord live worship translation/TTS system.

The Discord workflow is:

1. Kee types English sentences into a restricted Discord text channel.
2. The Discord bot receives only messages from Kee's Discord user ID and the configured text channel.
3. The message is accepted into an in-memory playback queue.
4. The Node server sends the text to a persistent Python Qwen3-TTS worker over JSON Lines (stdin/stdout).
5. The worker returns a base64 WAV.
6. Node uses ffmpeg to convert the WAV to 24 kHz mono signed 16-bit PCM.
7. Node converts 24 kHz mono PCM to 48 kHz stereo PCM.
8. `@discordjs/voice` plays the audio sequentially in the configured Discord voice channel.
9. The admin dashboard shows running/paused/stopped state, queue depth, current item, history, failure reason, speaker, style instruction, and speed.

The main unresolved issue is **production-quality TTS**. The Sandbox has a Qwen virtual environment, but the production Docker image currently installs only `ffmpeg`, `espeak-ng`, and `python3`. Therefore production frequently falls back to robotic `espeak-ng` audio. When Qwen CPU inference exceeds the 45-second request timeout, the same fallback also occurs.

The correct next step is to run Qwen3-TTS in a separate persistent machine with adequate RAM and preferably an NVIDIA GPU, then make the WebDev/Discord service call that worker over a private authenticated HTTP or WebSocket API.

---

## 2. Current observed behavior and root cause

The user reported that the bot works but sounds exactly like the old robotic voice. This is expected when the fallback is active.

Relevant historical logs:

```text
[qwen-tts] Setting `pad_token_id` to `eos_token_id`:2150 for open-end generation.
[discord-text-voice] Qwen3-TTS unavailable; using espeak fallback Qwen3-TTS request timed out
[discord-text-voice] spoke Kee message (... chars)
```

The current chain intentionally catches all Qwen failures:

```text
Qwen3-TTS attempt
  -> if worker unavailable, worker startup fails, inference times out, or ffmpeg conversion fails
  -> synthesize with espeak-ng
  -> play fallback PCM in Discord
```

Thus “bot works” does not mean “Qwen works.” It only means that either Qwen or the fallback generated audio successfully.

There are two separate production limitations:

### 2.1 The current Docker image does not contain Qwen

The current root `Dockerfile` installs:

- `ffmpeg`
- `espeak-ng`
- `python3`
- `ca-certificates`

It does **not** install:

- `qwen-tts`
- PyTorch
- `soundfile`
- the Hugging Face Qwen model weights
- a Python virtual environment
- a CUDA runtime or GPU

The Node adapter defaults to this Sandbox-only Python path:

```text
/home/ubuntu/qwen3-tts-venv/bin/python
```

That path is not expected to exist inside a clean production Docker container.

### 2.2 Qwen3-TTS 1.7B CPU inference is too slow for the current request timeout

The active default model is:

```text
Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice
```

The current Node worker request timeout is 45 seconds. In the Sandbox, long sentences and CPU inference exceeded that limit repeatedly. The current production WebDev runtime is not a suitable home for a 1.7B CPU TTS model because it has a small fixed runtime envelope and is not designed as a persistent GPU inference server.

---

## 3. Important project paths

### Website and admin UI

```text
client/src/App.tsx
client/src/pages/Home.tsx
client/src/pages/admin/DiscordTtsAdmin.tsx
client/src/pages/admin/TranslationAdmin.tsx
client/src/lib/trpc.ts
client/src/_core/hooks/useAuth.ts
```

`DiscordTtsAdmin.tsx` is the admin console. It uses OAuth/auth state and only enables status polling and control mutations for an authenticated user with `role === "admin"`.

### Discord/TTS backend

```text
server/translation/discordTextToVoice.ts
server/translation/discordVoice.ts
server/translation/discordTtsControl.ts
server/translation/qwenTtsWorker.py
server/translation/router.ts
server/translation/runtime.ts
server/_core/index.ts
server/_core/env.ts
```

### Translation pipeline

```text
server/translation/pipeline.ts
server/translation/service.ts
server/translation/sessionMachine.ts
server/translation/sentenceBuffer.ts
server/translation/translator.ts
server/translation/discordPublisher.ts
server/translation/geminiLive.ts
server/translation/types.ts
```

### Tests

```text
server/discordTextToVoice.test.ts
server/discordVoice.test.ts
server/discordTtsControl.test.ts
server/discordBotToken.test.ts
server/translation.test.ts
server/geminiApiKey.test.ts
server/discordWebhookSecret.test.ts
server/discordWebhookEnglishSecret.test.ts
```

### Reusable skill

```text
/home/ubuntu/skills/discord-qwen-live-worship-tts/SKILL.md
```

This skill contains the reusable workflow created for the Discord Qwen live worship TTS implementation.

---

## 4. Current implementation details

### 4.1 Python worker protocol

`server/translation/qwenTtsWorker.py` is a persistent JSONL worker.

Input example:

```json
{
  "id": "request-uuid",
  "text": "Welcome to Graceway Baptist Church.",
  "language": "English",
  "speaker": "Aiden",
  "instruct": "Speak clearly and warmly, suitable for a church announcement.",
  "speed": 1
}
```

Worker startup response:

```json
{
  "type": "ready",
  "model": "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
  "device": "cpu"
}
```

Successful response:

```json
{
  "id": "request-uuid",
  "ok": true,
  "wav": "BASE64_WAV_BYTES",
  "sampleRate": 24000
}
```

Failure response:

```json
{
  "id": "request-uuid",
  "ok": false,
  "error": "ErrorType: details"
}
```

The worker uses `generate_custom_voice`. It passes `instruct` only when the model name contains `1.7B`; this was done because the earlier 0.6B setup was less stable with instruction input.

### 4.2 Node Qwen adapter

`server/translation/discordTextToVoice.ts` starts one persistent child process and correlates JSONL responses by UUID.

Current defaults:

```text
QWEN_TTS_PYTHON=/home/ubuntu/qwen3-tts-venv/bin/python
QWEN_TTS_WORKER=<bundled qwenTtsWorker.py path>
QWEN_TTS_MODEL=Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice
QWEN_TTS_ENABLED=true unless explicitly set to false
```

The adapter marks Qwen unavailable for five minutes after worker startup failure. Each synthesis request has a 45-second timeout.

For a successful Qwen result, Node runs ffmpeg with:

```text
-af atempo=<speed>,acompressor=threshold=-18dB:ratio=2:attack=5:release=80:makeup=2,alimiter=limit=0.95
-f s16le -ar 24000 -ac 1
```

The result is expected to be 24 kHz mono signed 16-bit PCM.

### 4.3 eSpeak fallback

The fallback invokes:

```text
espeak-ng -v en-us -s <speed> --stdin --stdout
```

Then ffmpeg converts it to:

```text
24 kHz, mono, signed 16-bit little-endian PCM
```

The fallback exists for availability, but it is intentionally robotic and should not be considered acceptable final worship audio.

The current Dockerfile sets:

```text
FFMPEG_PATH=/usr/bin/ffmpeg
ESPEAK_NG_PATH=/usr/bin/espeak-ng
```

### 4.4 Discord voice output

`server/translation/discordVoice.ts`:

- accepts 24 kHz mono PCM
- converts to 48 kHz stereo PCM using linear interpolation
- queues complete sentence buffers
- uses `AudioPlayerStatus.Idle` to advance to the next sentence
- reconnects on a later write if the connection was disconnected
- rejects empty PCM instead of silently reporting success

The conversion function is:

```text
pcm24MonoToDiscordPcm(input: Buffer): Buffer
```

The Discord player uses:

```text
StreamType.Raw
```

and expects 48 kHz stereo signed 16-bit PCM.

### 4.5 Discord text listener

`DiscordTextToVoiceBot` uses these intents:

```text
Guilds
GuildMessages
MessageContent
```

It ignores messages unless all are true:

- message has the configured guild ID
- message is in the configured text channel
- author ID equals the configured Kee user ID
- author is not a bot
- content is non-empty
- dashboard session state is `running`

Messages are serialized through a promise queue, preserving order.

Failure history is now stage-specific:

```text
TTS synthesis stage failed: ...
Discord Voice playback stage failed: ...
```

### 4.6 Admin dashboard

Route:

```text
/admin/discord-tts
```

The dashboard supports:

- start
- pause
- stop
- current status
- queue depth
- history
- current item
- speaker selection
- style/instruction text
- speed from 0.75x to 1.5x
- one-second status polling
- login prompt for unauthenticated visitors
- administrator-role warning for authenticated non-admin users

Server-side control is in `discordTtsControl.ts` and is in-memory. Restarting the process clears the queue/history.

---

## 5. Environment variables

Do not put secret values in this handoff document. Configure them in the new server's secret manager.

### Required Discord variables

```text
DISCORD_BOT_TOKEN                       # secret
DISCORD_TRANSLATION_GUILD_ID            # default: 1558754920692457624
DISCORD_TRANSLATION_VOICE_CHANNEL_ID    # default: 1558754922277765213
DISCORD_TRANSLATION_TEXT_CHANNEL_ID     # default currently in server/_core/env.ts
DISCORD_TRANSLATION_ALLOWED_USER_ID     # Kee: 438023171459776525
```

The exact text channel default currently in `server/_core/env.ts` is:

```text
1558763380708216903
```

The earlier “Transloator” voice channel ID is:

```text
1558754922277765213
```

### Translation variables

```text
GEMINI_API_KEY                         # secret, for Gemini Live translation
DISCORD_TRANSLATION_WEBHOOK_KO         # secret webhook URL
DISCORD_TRANSLATION_WEBHOOK_EN         # secret webhook URL
```

### Qwen variables

```text
QWEN_TTS_ENABLED=true
QWEN_TTS_MODEL=Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice
QWEN_TTS_SPEAKER=Aiden
QWEN_TTS_INSTRUCT=Speak clearly and warmly, suitable for a church announcement.
QWEN_TTS_PYTHON=/path/to/python
QWEN_TTS_WORKER=/path/to/qwenTtsWorker.py
QWEN_TTS_REQUEST_TIMEOUT_MS=45000   # not yet implemented as an env override
FFMPEG_PATH=/usr/bin/ffmpeg
ESPEAK_NG_PATH=/usr/bin/espeak-ng
```

The code currently reads the first five Qwen variables, but the request timeout is hard-coded to 45,000 ms and should be made configurable on the new worker deployment.

### Existing application variables

The WebDev project also uses the standard Manus variables:

```text
DATABASE_URL
JWT_SECRET
VITE_APP_ID
OAUTH_SERVER_URL
OWNER_OPEN_ID
OWNER_NAME
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_URL
VITE_FRONTEND_FORGE_API_KEY
```

---

## 6. Discord permissions and intents

The bot token must be valid and the Discord Developer Portal must have Message Content Intent enabled.

The bot needs, at minimum:

- View Channels
- Send Messages in the configured text channel if text responses/announcements are used
- Connect to the voice channel
- Speak in the voice channel
- Use Voice Activity if required by the server configuration

The bot must be invited to the correct Guild and have access to the configured voice and text channels.

If Discord returns `Used disallowed intents`, enable Message Content Intent in the Developer Portal and restart the bot.

---

## 7. Current production Dockerfile and limitation

The current root Dockerfile is intentionally minimal:

```dockerfile
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    espeak-ng \
    python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN npm install -g corepack@latest \
    && corepack pnpm install \
    && corepack pnpm run build

ENV NODE_ENV=production \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    ESPEAK_NG_PATH=/usr/bin/espeak-ng

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

This fixes `spawn espeak-ng ENOENT`, but it does **not** install Qwen. Do not assume that this Dockerfile provides Qwen merely because it includes Python.

A full in-container Qwen image would need to install PyTorch, qwen-tts, soundfile, model weights, and possibly CUDA. This is likely too large and too slow for the current WebDev production runtime. Use a separate persistent worker instead.

---

## 8. Recommended next architecture: persistent Qwen worker

### Preferred topology

```text
Discord text channel
        |
        v
Node Discord bot / WebDev server
        |
        | authenticated HTTP or WebSocket request
        v
Persistent GPU/CPU worker server
        |
        v
Qwen3-TTS model loaded once in memory
        |
        v
24 kHz mono PCM or WAV
        |
        v
Node Discord voice output
```

### Worker API proposal

`POST /v1/synthesize`

Request:

```json
{
  "text": "Welcome to Graceway Baptist Church.",
  "language": "English",
  "speaker": "Aiden",
  "instruct": "Speak clearly and warmly, suitable for a church announcement.",
  "speed": 1.0,
  "format": "pcm_s16le",
  "sampleRate": 24000,
  "channels": 1
}
```

Response options:

1. Binary `audio/pcm; rate=24000; channels=1; format=s16le`
2. Binary WAV with a short-lived request ID
3. Streaming response for low-latency long messages

Recommended first implementation: binary PCM response with an internal API key or mTLS. Avoid base64 for long sermon sentences because it increases memory and bandwidth overhead.

### Worker requirements

Recommended starting point:

- Linux x86_64
- persistent disk for Hugging Face model cache
- 16 GB RAM minimum for experimentation with 1.7B CPU; more is preferable
- NVIDIA GPU with sufficient VRAM for reliable low-latency inference
- Python 3.10 or 3.11
- isolated virtual environment
- model pre-download during setup
- one model process kept warm
- bounded request queue
- request timeout and cancellation
- health endpoint reporting model/device/readiness

Example health response:

```json
{
  "ready": true,
  "model": "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
  "device": "cuda",
  "sampleRate": 24000,
  "queueDepth": 0
}
```

### Security requirements

- Never expose the worker unauthenticated to the public internet.
- Store the worker API key only in the WebDev secret manager and worker secret manager.
- Restrict inbound traffic by Tailscale/private network/firewall where possible.
- Rotate any Discord/Gemini/webhook credentials that have ever been pasted into chat or logs.

---

## 9. Recommended code changes for the new agent

1. Add `QWEN_TTS_REMOTE_URL` and `QWEN_TTS_REMOTE_API_KEY` support.
2. Prefer remote Qwen when configured; use local Qwen only when explicitly enabled.
3. Add a `ttsEngine` field to each history item: `qwen-local`, `qwen-remote`, or `espeak-fallback`.
4. Display the actual engine in the admin history so “completed” cannot be confused with “Qwen completed.”
5. Add `qwenStatus` to the dashboard:
   - worker reachable/unreachable
   - model name
   - device
   - average synthesis latency
   - last error
6. Make the 45-second timeout configurable.
7. Split very long Discord messages into sentence-sized units before synthesis. The reported failed message was a long paragraph of approximately 1,500 characters; sending long paragraphs as one Qwen request greatly increases latency.
8. Add a maximum input length per request, e.g. 250–400 characters, and queue each sentence separately.
9. Add cancellation when an item is stopped or superseded.
10. Do not silently fall back to eSpeak during a worship service if high-quality output is required. Make fallback behavior a dashboard setting:
    - `strict-qwen`: mark failed and show reason
    - `allow-fallback`: use eSpeak and label the engine clearly
11. Add a production smoke test that synthesizes a short sentence and verifies:
    - worker health
    - response format
    - sample rate
    - non-empty PCM
    - end-to-end Discord playback

---

## 10. Important audio constraints

- Qwen output is expected to be 24 kHz mono PCM after WAV decoding.
- Discord raw PCM playback expects 48 kHz stereo signed 16-bit PCM.
- Do not feed 24 kHz mono directly into the Discord raw player.
- Do not apply `atempo` twice. Qwen output currently uses ffmpeg `atempo=<speed>` once.
- Avoid aggressive compression or clipping; the current limiter is intended to prevent peaks but should be re-evaluated after remote Qwen is working.
- The linear interpolation resampler is simple and functional. A higher-quality resampler such as ffmpeg `aresample=48000` can be benchmarked later, but it is not the cause of the current robotic voice.

---

## 11. Validation commands

From `/home/ubuntu/graceway-church-website`:

```bash
pnpm test -- --run
pnpm check
pnpm build
/home/ubuntu/qwen3-tts-venv/bin/python -m py_compile server/translation/qwenTtsWorker.py
```

Current latest validation result before this handoff:

```text
12 test files passed
25 tests passed
TypeScript check passed
Production build passed
Dockerfile static validation passed
```

Local Sandbox-only Qwen checks:

```bash
/home/ubuntu/qwen3-tts-venv/bin/python server/translation/qwenTtsWorker.py
```

Then send one JSONL request on stdin. The worker should first emit a `ready` line, then an `ok: true` response.

Do not use the Sandbox worker result as proof that production has Qwen installed. The Sandbox path and production container are different environments.

---

## 12. Checkpoint history

```text
520e82c  Qwen3-TTS 0.6B worker installed and connected; eSpeak fallback added
f9ff1db  Discord Qwen TTS admin dashboard added
a4aa98b7  Qwen default changed to 1.7B; PCM and speed tuning
10a96045 Admin login/role handling fixed for Discord TTS dashboard
65cfce57  Failure-stage reporting and Discord Voice reconnection added
e6b00b8d  Production Dockerfile with ffmpeg/espeak-ng/python3 added
```

The current source branch is clean and points to `e6b00b8`.

---

## 13. Handoff acceptance criteria

The next agent should not consider the task complete until all of the following are true:

- [ ] A persistent Qwen worker is reachable from the Discord bot server.
- [ ] Worker health reports the expected model and device.
- [ ] A short English sentence completes in a reasonable latency.
- [ ] The returned audio is confirmed to be Qwen output, not eSpeak fallback.
- [ ] The admin history labels the actual engine.
- [ ] A long paragraph is split or queued safely instead of timing out as one request.
- [ ] Discord playback remains intelligible over at least five consecutive messages.
- [ ] Worker/API authentication is enabled.
- [ ] No secrets are committed to the repository or handoff document.
- [ ] Vitest, TypeScript check, build, worker smoke test, and Discord playback smoke test pass.
