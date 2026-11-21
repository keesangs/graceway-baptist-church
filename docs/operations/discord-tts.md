# Discord TTS 운영·유지보수

**2026-11-20 verified** — 새 Claude Code 채팅을 위한 코드·문서 기준점입니다. 일반 소스·테스트, [`todo.md`](../../todo.md), [`inworld-voice-controls.md`](../inworld-voice-controls.md)를 대조했습니다. 아래 과거 관찰에는 원래 날짜를 따로 표시했습니다. 이번 작성에서는 외부 API·브라우저·봇 실행·DB 접근·자격증명 확인·테스트 재실행을 하지 않았으며, 현재 연결/호스팅 상태를 실시간 보증하지 않습니다.

## 1. 관리 진입점·현재 설정·운영 금지선

관리 URL: **<https://graceway-baptist.org/admin/discord-tts>**. `client/src/App.tsx`의 route와 `client/src/pages/DiscordTtsAdmin.tsx`가 진입점입니다. 로그인뿐 아니라 `role === "admin"`이 필요하며 `discordTts.*`, `discordTranscript.*` 모두 서버 `adminProcedure`입니다. API 진입점은 `/api/trpc`입니다. Discord 실시간 입력은 설정된 guild/text channel/allowed sender만 받고 봇·타 사용자 메시지를 제외합니다. intents는 Guilds/GuildMessages/MessageContent/GuildVoiceStates, 음성 권한은 View Channel·Connect·Speak를 확인합니다. 실제 사용자·채널 ID를 문서에 복사하지 마세요.

**문서만 바뀌면 배포·재배포·재시작하지 마세요.** 재배포는 Runtime ID/프로세스를 바꾸고 기존 voice 연결을 끊거나 연결 timeout을 유발할 수 있습니다. 과거 성공 checkpoint보다 최신 정상 배포를 보존하세요. 동일 토큰의 개발 봇·smoke script를 중복 실행하지 마세요. `server/_core/index.ts`는 개발 모드에서는 명시적 autostart가 없으면 시작하지 않지만, 비개발 모드에서는 명시적 비활성화가 없으면 시작을 시도합니다. `pnpm start`는 읽기 전용 점검이 아닙니다.

**Reserved는 중요한 운영 전제입니다.** `todo.md`에는 승인 후 Reserved 전환, 지속 연결과 packet timing 개선, 청취자 개선 확인이 기록되어 있습니다. 원고 admission의 직렬화와 메모리 큐/batch는 **단일 Reserved 프로세스**를 전제로 하므로 Autoscale/다중 replica 전환은 별도 설계·승인 대상입니다. 이것이 모든 지연의 CPU 원인을 증명하지는 않습니다. todo의 전환 전 “Autoscale Current / Reserved 미선택” 문장은 뒤의 승인·전환 기록과 시간순으로 읽으세요. 최신 실제 상태와 비용은 허가된 운영 점검에서 확인해야 합니다.

### Inworld 음성 설정

현재 기본 provider/model은 **DeepInfra `inworld-ai/realtime-tts-1.5-mini`**, 추론 URL은 `https://api.deepinfra.com/v1/inference/inworld-ai/realtime-tts-1.5-mini`입니다. 기본값은 **Dennis / speaking rate 1.1 / temperature 1.1**입니다. 요청에는 `voice`, `speaking_rate`, `temperature`, `output_format: "wav"`를 명시합니다. rate는 0.5–1.5, temperature는 0–2이며, temperature는 표현 변동성이지 정확한 감정·pitch·accent 지정이 아닙니다. legacy `instruct`는 hosted 추론에 보내지 않고, 요청에 남은 `language`는 기존 hosted 1.5 검증상 무시됩니다.

**2026-11-20 verified:** 보존된 preset snapshot은 **127 voices**입니다. 원래 schema 검증일은 **2026-11-18**, version은 `DuCYVWIF`이며 “130+” 홍보 숫자와 구별합니다. catalog는 모델 metadata와 계정 `/v1/voices`의 custom ID/name만 합쳐 중복 제거합니다. 조회 실패에는 snapshot/경고를 제공하고 계정 metadata/key를 반환하지 않습니다. 미래 수량은 달라질 수 있으며 voice clone/create 기능은 아닙니다.

voice 선택은 즉시, slider는 400 ms debounce/0.01 step으로 부분 patch를 저장합니다. `discord_tts_preferences` singleton은 speaker/rate/temperature와 UTC 갱신 시각만 보존합니다. 부분 저장 직렬화로 덮어쓰기를 막고 실패를 성공으로 표시하지 않으며, 재시작 때 복원합니다. 설정은 **각 합성 시작 시 snapshot**으로 고정되어 다음 문장/문단 합성부터 변경됩니다. 관리 UI의 key 입력은 write-only/서버 메모리 전용이라 재시작 시 사라집니다. key와 remote-enabled는 preferences DB에 저장하지 않습니다.

환경변수는 **이름만** 인계합니다. 봇: `DISCORD_BOT_TOKEN`, `DISCORD_TTS_BOT_ENABLED`, `DISCORD_TTS_BOT_AUTOSTART`, `DISCORD_TRANSLATION_GUILD_ID`, `DISCORD_TRANSLATION_TEXT_CHANNEL_ID`, `DISCORD_TRANSLATION_VOICE_CHANNEL_ID`, `DISCORD_TRANSLATION_ALLOWED_USER_ID`. TTS: `DEEPINFRA_API_KEY`, `DEEPINFRA_TTS_ENABLED`, `DEEPINFRA_TTS_REMOTE_URL`, `INWORLD_TTS_SPEAKER`. 호환/실행: `QWEN_TTS_REMOTE_URL`, `QWEN_TTS_REMOTE_TIMEOUT_MS`, `QWEN_TTS_INSTRUCT`, `ESPEAK_NG_PATH`, `FFMPEG_PATH`, `NODE_ENV`. `.env`·자격증명 파일/값, 사용자 원고, 개인 DB 기록을 문서나 공개 issue에 포함하지 마세요.

## 2. 두 송출 경로·private storage·복구 계약

| 구분 | 실시간 Discord 텍스트 | 관리자 수동 transcript |
| --- | --- | --- |
| 단위 | `splitDiscordTextIntoSentences`: 문장부호 경계, 긴 chunk 최대 400자 | **선택한 한 문단 = 합성 호출 1회 = Opus resource 1개** |
| 줄바꿈 | 기존 문장 분할 유지 | 일반 줄바꿈은 공백 결합; **빈 줄(blank line)은 문단 경계** |
| 진행 | 현재 resource 완료 후 다음 큐 item | 다음 문단은 다시 명시적으로 Send 필요 |

수동 문단은 문장부호/400자 때문에 쪼개지 않습니다. `shared/discordTranscriptFeed.ts`는 whitespace 정규화 후 **2,000자**(JS 문자열 `.length`)를 검사합니다. 초과 시 UI/서버에서 **run 생성·합성 전에 거절**하며 자동 분할·절단·생략은 금지입니다. 운영자가 의미 단위로 빈 줄을 넣고 다시 가져와야 합니다. import의 문단당 **12,000자** 보존 한도와 송출 **2,000자** 한도는 다릅니다. 기존 긴 저장 문단을 삭제/재작성하지 마세요. 합성 공통 URL/mention 발화 대체는 적용됩니다. 원격 장애의 local fallback은 별도 시도이므로 장애까지 provider HTTP 1회를 보장한다는 뜻은 아닙니다.

**절대 자동 다음 문단 송출 금지:** import, 선택, 이전/다음, preview, polling, 새로고침/remount, 재연결, 완료 이벤트는 speech enqueue를 유발하면 안 됩니다. 완료하면 다음 문단을 **선택/하이라이트만** 할 수 있습니다. legacy `sentenceCount`/`completedCount`와 화면의 sentence label이 남아도 신규 수동 run은 **1 단위, 완료 0/1**입니다. 과거 문장별 run 표시는 호환 유지하며 whole-paragraph 전환에는 새 migration이 없었습니다.

### private parsed-text storage

지원: 붙여넣기, .txt/.md/.docx/**selectable-text PDF**. 파일 **2 MiB**, 전체 text **150,000자**, **500문단**, 파서 문단당 **12,000자** 제한입니다. UTF-8/BOM UTF-16, 확장자·MIME·magic·canonical base64·제어문자/Unicode 및 DOCX ZIP 확장 크기/entry/암호화/경로를 검증합니다. parser worker는 **10초 timeout/메모리 제한**과 종료 대기를 갖습니다. 스캔 PDF는 OCR을 먼저 하거나 text를 붙여 넣어야 하며 앱은 OCR하지 않습니다. PDF 문단 추출은 best effort이므로 송출 전 preview를 검토하세요. 번역/의미 재작성은 하지 않습니다.

`discord_transcripts`는 parsed paragraphs·제목/파일명·성공 위치·작성자 참조/시각, `discord_transcript_runs`는 UUID·index·상태/완료 단위·runtime/요청자 참조·시각/오류를 private DB에 저장합니다. **원본 bytes·public object URL·오디오는 저장하지 않습니다.** private는 admin API 제한이지 별도 암호화 보장이 아닙니다. 제목/파일명/오류도 민감할 수 있습니다. import/get/delete는 DB 작업이며 코드 읽기와 구별하세요. 스키마는 `drizzle/schema.ts`, migration은 `0020`(preferences)/`0021`(원고·run)입니다. 복원을 이유로 `db:push`를 무조건 실행하지 마세요.

### idempotency / replay / cancel / restart

- **Admission:** Connected + 실제 voice Ready + 합성/재생/큐 idle이어야 합니다. 서버 admission/delete 직렬화와 UI 동기 click guard/pending 잠금으로 이중 요청을 막습니다.
- **응답 유실:** “같은 요청 재시도”는 원래 문서/index/payload/UUID를 재사용합니다. 서버는 기존 run을 반환해 재합성하지 않고, 다른 문단에 같은 UUID를 쓰면 conflict입니다. 응답 timeout은 재생 실패의 증거가 아닙니다.
- **Replay:** 이미 시도한 문단/성공 위치 이전 문단은 새 UUID와 **전체 문단 재송출 확인**이 필요합니다. 들은 부분도 반복됩니다. 원고 실패에는 일반 “마지막 메시지 재시도”가 아니라 문단 패널을 사용합니다.
- **진척:** 성공 완료만 `nextParagraph = GREATEST(기존, index + 1)`로 저장합니다. 가장 먼 성공 위치이지 앞 문단의 연속 완료 증명은 아닙니다. progress write는 audio 경로 밖에서 직렬화하고 오류를 표시합니다. 접수는 완료가 아닙니다.
- **Pause/Stop:** Pause는 다음 큐 처리를 멈추며 현재 발화를 즉시 취소하지 않습니다. Stop은 player/큐/retry timer를 정리하고 활성 문단을 cancelled로 처리합니다. generation guard로 늦은 합성/worker 결과의 송출을 막지만 이미 시작한 provider 요청의 즉시 취소를 보장하지 않습니다.
- **Restart:** 메모리 queue/batch/history는 복원하지 않습니다. DB queued/playing에 대응하는 live batch가 없으면 조회 시 interrupted로 해석하고 **자동 replay/위치 전진을 하지 않습니다**. 운영자가 확인 후 전체 replay해야 합니다. 활성 원고 삭제는 차단하고, 삭제 확인 시 원고/run metadata를 함께 제거합니다.

## 3. buffered audio·상태 진단·WAV 비교

파이프라인은 합성 → **48 kHz stereo signed 16-bit PCM** → 복사본 경계 보정 → worker **20 ms Opus packets 전량 사전 인코딩** → buffered resource → 순서 재생입니다. 표준 PCM/float WAV와 raw 24 kHz mono PCM은 **native TypeScript 변환 우선**, 미지원 형식은 ffmpeg fallback입니다. 원격 장애/비활성화의 `local-fallback`(espeak-ng → ffmpeg)은 별도 계층입니다. last engine/오류를 보고 local 음성을 Inworld 성공으로 오해하지 마세요.

원본/변환 buffer를 보존한 복사본에 stereo 동일 raised-cosine **fade-in 6 ms / fade-out 12 ms**를 적용하며 interior/원래 sample 수를 유지합니다. 짧은 clip은 ramp를 제한합니다. worker는 48 kHz/2ch/VOIP, 64 kbps/complexity 5/FEC를 사용하고 expected loss 설정은 측정 손실률이 아닙니다. 선행 encoded silence 5 ×20 ms, 마지막 partial frame zero padding, **같은 encoder로 만든 3 ×20 ms = 60 ms tail**, resource canonical silence padding을 유지합니다. timed player에 encoder transform을 넣지 않습니다.

현재 codec은 **`opusscript-worker`**라 native Opus 없이 동작합니다. `@discordjs/opus` dependency가 있다고 자동 native 전환되는 것은 아닙니다. 프로젝트는 **ESM**(`type: module`, esbuild ESM bundle)이며 오디오/parser는 self-contained CommonJS eval worker, `createRequire(import.meta.url)` dependency resolve, `execArgv: []`를 사용합니다. 별도 worker 파일 복사나 TS/Vitest/`--input-type=module` loader 상속에 의존하지 마세요. audio worker timeout은 30초, PCM 상한은 120초, playback Idle deadline은 PCM 길이+30초/최소120초입니다.

연결은 login 후 **Gateway ClientReady를 별도 대기**하고 voice Ready를 기다립니다. 실패/Stop의 terminal `destroy()` 후 retirement를 기다리고 새 Client/adapters를 만들며 message/player listener 중복과 연결별 subscription 중복을 방지합니다. abort 계열 초기 연결 retry는 최대3회, 연결 후 recovery는 최대5회입니다. 진행 중 Start/Retry를 겹치지 마세요.

관리 화면은 bot state·queue/current item·Runtime ID·단계별 `lastErrorCode`, TTS engine/count/latency·preferences error를 분리해 보여줍니다. voice/networking diagnostics는 WebSocket opening/identifying, UDP discovery, protocol selection, Ready 등 **allowlisted label만** 노출합니다. underlying networking/token/encryption 객체를 덤프하지 않으며 실패 시 destroy 전 단계/제한된 transition history를 보존합니다. playback에는 audio/wall duration, encoding time, packet count/reads, underflow, max read gap(목표20 ms), interruptions, 6/12/60 ms, WS/UDP ping이 있습니다. 현재 UI는 gap>60 ms 또는 underflow/interruption에 경고합니다. 반복 조회 Runtime ID 변경은 rollout/다중 instance 확인 신호이지 확정 진단이 아닙니다. 서버 수치는 수신자 손실/청취 품질을 보증하지 않습니다.

**WAV 비교:** `Test short sentence`는 Discord를 거치지 않고 합성·변환만 합니다(외부 TTS 호출/비용 가능). 원본 provider WAV / 변환 48 kHz stereo WAV / 경계 보정 WAV를 transient base64로 반환하며 저장하지 않습니다. local fallback의 원본 칸은 변환 WAV입니다. 보정 WAV에는 **Opus leading/padding/60 ms tail이 없습니다**. “Discord 송출 테스트”는 별도 버튼으로 실제 채널에 소리를 보냅니다. 원본부터 이상하면 provider, 변환부터 이상하면 conversion, 세 WAV가 정상인데 Discord만 이상하면 server timing·연결 경로·수신 환경을 구분해 조사합니다. preview 성공은 송출/청취 성공이 아닙니다.

**2026-11-20 verified — 교정된 과거 판단:** `player.play()`는 state를 동기 변경하므로 “이전 Idle이 남아 다음 문장이 겹쳤다”는 추측을 확정 원인으로 반복하지 마세요. 2026-11-18 기록에는 WebSocket·UDP discovery·protocol selection을 지나 Ready에 도달한 사례가 있어 **환경 전체 UDP 차단 주장도 틀립니다**. 이전 실패 substage는 미확정이고 AbortError만으로 UDP 제한/HTTP 취소를 결론내리지 않습니다. Autoscale gap600/496 ms → Reserved40/22 ms는 scheduling 차이의 관찰이지 CPU/부하 단일 원인의 증명이 아닙니다. endpoint/tail은 경계 소음의 개연성 있는 기전으로 검토했고, 6/12/60 ms와 lifecycle 수정 후 2026-11-18 청취자가 해당 전환 잡음 해결을 확인했습니다. 수신 녹음은 없어 모든 미래 잡음 제거를 보장하지 않습니다.

## 4. 승인된 검증과 코드·테스트 지도

**실제 송출·Start/Stop/Retry·replay·import/delete·배포는 운영자 승인과 사용자 환경 확인 후에만** 수행합니다. 시간/채널/청취 가능 여부, 다른 사용자 활동, 기존 bot state/queue, 테스트 횟수·문구·비용과 상태 복구 범위를 확인하세요. 원래 상태를 보지 않고 “보존했다”고 주장하거나 타인의 큐/문서를 지우지 마세요. 승인된 최소 테스트에서도 다음 문단은 withholding하여 자동 발화가 없음을 확인하고, server 완료와 청취자 확인을 따로 기록합니다. 삭제는 테스트용 synthetic draft만 대상으로 하며 공유 기록에 사용자 원고·개인 metadata·key를 넣지 않습니다.

| 코드(저장소 기준) | 책임 / 테스트(`server/` 기준) |
| --- | --- |
| `server/discordBot.ts`, `server/_core/index.ts` | splitter·문단 큐·Ready/retry·Stop/autostart / `discord-bot-runtime.test.ts`, `discord-client-lifecycle.test.ts`, `discord-paragraph-runtime.test.ts` |
| `server/discordTts.ts`, `discordTtsPreferences.ts`, `discordVoiceCatalog.ts`; `shared/discordVoiceControls.ts` | hosted request·native conversion/fallback·설정/catalog / `discord-tts.test.ts`, `discord-voice-controls.test.ts` |
| `server/discordAudio.ts`, `discordVoiceDiagnostics.ts` | worker/buffer·fade/tail·안전 진단 / `discord-audio-behavior.test.ts`, `discord-audio-boundary.test.ts`, `discord-voice-diagnostics.test.ts` |
| `server/discordTranscriptParser.ts`; `shared/discordTranscriptFeed.ts` | 파일 보안·blank line·2,000자 / `discord-transcript-parser.test.ts`(synthetic DOCX/PDF·ESM), `discord-paragraph-runtime.test.ts` |
| `server/discordTranscript.ts`, `server/db.ts`, `drizzle/schema.ts` | admin API·dedupe·진척/restart·private storage / `discord-transcript-api.test.ts`(mock DB) |
| `server/routers.ts`, `client/src/pages/DiscordTtsAdmin.tsx` | preview/송출 분리·diagnostics UI / `discord-audio-admin.test.ts`, `discord-audio-dashboard.test.ts` |
| `client/src/components/DiscordTranscriptControls.tsx`, `DiscordVoiceControls.tsx` | no-auto-send·replay/응답 guard·저장 feedback / `discord-transcript-ui.test.ts`, `discord-voice-controls-ui.test.ts` |

코드 변경 검증은 `package.json`의 `pnpm check`, `pnpm test`, `pnpm build`가 기준입니다. 좁힌 예: `pnpm exec vitest run server/discord-paragraph-runtime.test.ts server/discord-transcript-api.test.ts server/discord-transcript-ui.test.ts`. 관련 테스트는 mock provider/DB/client 또는 로컬 synthetic fixture를 사용하지만 실행 전 대상/설정을 검토하세요. build는 산출물을 작성하고 live smoke script/start는 실제 봇·외부 요청을 수행할 수 있습니다. **한 파일만 쓰는 문서 작업에는 이들 실행·migration·배포가 불필요합니다.** `pnpm format`은 저장소 전체를 수정하므로 사용하지 마세요.

**2026-11-20 verified — 과거 숫자(이번 재실행 아님):** todo는 whole-paragraph 전환 때 **79 Vitest files/396 tests** + TypeScript/build 통과(원래2026-11-18), 최신 별도 기도 화면 변경 때 전체 **80 files/414 tests** + TypeScript/build 통과(2026-11-20)를 기록합니다. 새 실행 결과로 인용하지 마세요. 2026-11-18 수동 문단 실서비스 관찰은 첫 문단만 **1 추가 Inworld request/1 history item/1 완료 단위**, 다음 문단 미송출, gap22 ms/underflow0이었습니다. 한 번의 관찰이지 현재 runtime/모든 청취 환경의 보증이 아닙니다. 후속 채팅은 최신 코드와 먼저 대조하고, 과거 수치 재현만을 위해 허가 없이 송출·재배포하지 마세요.
