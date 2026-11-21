# 개발·환경·복원 runbook

이 저장소를 clone하면 코드·테스트·migration·프로젝트 맥락·재사용 skill·산출물 참조를 받을 수 있습니다. **DB 회원 데이터·비밀정보·외부 서비스의 실제 계정 설정은 복제되지 않습니다.** 환경값은 승인된 secret manager나 운영 담당자에게서 받으세요. [환경변수 목록](environment-variables.md)은 값이 없는 안전한 참조 문서입니다.

## 새 Claude Code 채팅의 시작

```bash
git clone https://github.com/keesangs/graceway-baptist-church.git
cd graceway-baptist-church
# 이 디렉터리에서 Claude Code를 시작하면 CLAUDE.md를 진입점으로 사용합니다.
pnpm install --frozen-lockfile
```

Node **22 이상**, pnpm은 `package.json`의 `packageManager`를 기준으로 준비하세요. package lock과 `pnpm-workspace.yaml`을 유지하세요. 운영 Discord 런타임과 같은 봇을 로컬에서 켜지 않는 것이 우선입니다. 개발 기본은 `DISCORD_TTS_BOT_AUTOSTART=false`입니다.

```bash
# 환경변수 목록을 참고해 승인된 개발용 값만 별도 로컬 환경에 설정합니다.
# 실제 키는 문서·채팅·Git에 붙여 넣지 않습니다.
pnpm dev
```

`.env`의 `NODE_ENV=development` 및 봇 autostart false를 유지하세요. 기본 preview는 포트 3000 근처에서 출력되며 사용 중이면 실제 시작 로그의 주소를 사용하세요. 운영 secret을 그대로 복사하기보다 별도 개발 DB·OAuth callback·테스트 계정을 권장합니다. DB/OAuth/storage 설정이 비어 있으면 실제 저장·로그인·이미지 연동을 검증할 수 없습니다. 이는 소스 누락이 아닙니다.

## 환경변수 그룹

| 그룹 | 이름 | 새 환경에서 확인할 사항 |
| --- | --- | --- |
| 핵심 | `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID` | 승인된 MySQL/TiDB 접속, 세션 signing, 앱/OAuth callback과 관리자 ownership. owner ID나 user role을 임의로 설정하지 않음. |
| 객체 저장소·플랫폼 기능 | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY` | 기존 managed storage proxy 계약. 서버 키를 VITE 변수에 복사하지 않음. 기존 frontend-scoped key도 임의로 만들지 않음. 다른 호스팅에서는 대체 구현이 필요. |
| 메일 | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` | 검증된 sender/domain, 원문 body 기반 webhook signature 검증. 실제 발송 전 수신자·payload 승인. Google Workspace 받은편지함과 Resend 발송 기능은 별개. |
| 영상·성경·주보 | `YOUTUBE_DATA_API_KEY`, `YOUVERSION_API_KEY`, `GOOGLE_DRIVE_BULLETIN_FOLDER_ID` | 원래 playlist/public Drive folder와 라이선스·권한 유지. |
| Photos Picker | `GOOGLE_PHOTOS_CLIENT_ID`, `GOOGLE_PHOTOS_CLIENT_SECRET`, `GOOGLE_PHOTOS_REDIRECT_URI` | 등록된 callback origin 및 OAuth 연결. 선택 기반 가져오기만 허용. |
| Discord | `DISCORD_BOT_TOKEN`, `DISCORD_TRANSLATION_GUILD_ID`, `DISCORD_TRANSLATION_TEXT_CHANNEL_ID`, `DISCORD_TRANSLATION_VOICE_CHANNEL_ID`, `DISCORD_TRANSLATION_ALLOWED_USER_ID` | bot/채널/메시지 송신자 권한은 외부 Discord 설정. 표시 이름 Admin과 immutable user ID를 혼동하지 않음. |
| TTS와 runtime | `DEEPINFRA_API_KEY`, `DEEPINFRA_TTS_ENABLED`, `INWORLD_TTS_SPEAKER`, `DISCORD_TTS_BOT_ENABLED`, `DISCORD_TTS_BOT_AUTOSTART` | 실제 모델·voice controls는 현행 코드/DB preferences 기준. 설정 확인만으로 실제 합성/음성 채널 송출을 수행하지 않음. |
| 선택 override | `DEEPINFRA_TTS_REMOTE_URL`, `QWEN_TTS_REMOTE_URL`, `QWEN_TTS_REMOTE_FORMAT`, `QWEN_TTS_REMOTE_TIMEOUT_MS`, `QWEN_TTS_SPEAKER`, `QWEN_TTS_INSTRUCT`, `FFMPEG_PATH`, `ESPEAK_NG_PATH`, `PORT` | legacy 이름이 남아도 현행 provider는 Inworld. local fallback binary는 기본 환경에 자동 설치된다고 가정하지 않음. |

전체 이름은 코드의 `process.env`/`import.meta.env`와 `server/_core/env.ts`를 확인하세요. 환경변수 참조 문서는 provisioning이나 유효한 key를 대신하지 않습니다.

## 데이터 복원

`drizzle/schema.ts`가 모델, `drizzle/`의 SQL과 meta journal이 migration 기록입니다. **0020**은 non-secret Discord preferences, **0021**은 private transcript·runs를 추가합니다. 일반 clone은 실제 데이터와 migration 적용 상태를 보증하지 않습니다.

기존 운영 DB에 적용된 SQL을 다시 실행하지 마세요. 새 DB 복원은 승인된 private backup과 migration journal을 비교한 후 비파괴 계획으로 진행하세요. `pnpm db:push`는 generate와 migrate를 함께 실행하므로 운영 DB URL을 둔 상태에서 습관적으로 실행하면 안 됩니다. 계정, 구독자·확인 토큰, 문의, private QT 노트, OAuth 연결, transcript, delivery 기록은 public SQL dump로 만들지 않습니다.

## 정적 산출물과 외부 객체

[산출물 inventory](../artifacts/inventory.json)는 Git에 포함된 작은 파일, 외부 branding source ZIP 및 공개 `/manus-storage/` 참조를 구분합니다. `scripts/artifacts/restore_public_assets.py`는 명시적으로 선택한 공개 자산을 별도 폴더에 내려받고 checksum을 확인합니다. 실행 전에 manifest와 ZIP 크기를 검토하세요.

```bash
python3 scripts/artifacts/restore_public_assets.py --list
python3 scripts/artifacts/restore_public_assets.py --id branding-source-archive --output ../graceway-restored-assets
```

다운로드는 재배포나 DB 변경이 아닙니다. 큰 바이너리를 저장소에 다시 복사하지 마세요. `/manus-storage/...`는 기존 호스팅의 storage proxy 경로이므로 `localhost`에서 저절로 제공되지 않습니다. 별도 호스팅 이전 시 객체 storage/provider adapter·공개 URL·CDN과 접근 정책을 따로 구성해야 합니다. archive와 참조는 외부 저장소의 영구 보존 보장이 아니라 복원 가능성을 높이기 위한 색인입니다.

## 예약·외부 계정 복원

주보 예약 경로는 `/api/scheduled/weekly-newsletter-sync`입니다. 서버는 검증된 cron user/task UID와 DB의 `scheduleCronTaskUid`가 맞는지 확인하고, **일요일09시 America/Los_Angeles**인지 DST-aware gate로 확인합니다. 기존 heartbeat는 16:00/17:00 UTC의 두 확인 시각을 사용합니다. Git에는 callback 코드만 있고 실제 스케줄 등록/identity는 없습니다. 다른 scheduler로 옮기려면 이에 맞는 인증 adapter를 설계해야 하며 fake cron/session을 생성하지 마세요. clone 명령만으로 자동 발송이 설치되었다고 보고하지 않습니다.

Resend sender verification/webhook registration, Google Workspace inbox·MX/SPF/DKIM/DMARC, Google Photos consent/callback, Discord intents·permissions, YouTube playlists 및 DNS/www/SSL은 외부 계정에서 확인합니다. 기존 DNS 기록을 웹사이트 코드 수정 중에 임의로 변경하지 마세요.

## 검증·배포·장애 회복

```bash
pnpm check
pnpm test
pnpm build
python3 scripts/artifacts/audit_handoff.py
```

일부 기존 테스트는 설정된 제공자에 read-only credential 확인을 합니다. key 없이 실행한 결과와 운영 설정 상태를 구분하세요. Python 산출물 스크립트는 앱 runtime이 아니라 optional 도구이며, 별도 가상환경에서 Pillow 또는 Qwen benchmark 의존성을 설치하세요. benchmark는 모델을 내려받고 CPU를 오래 사용하므로 일반 웹 개발 검증에서 실행하지 않습니다.

마지막 확인된 운영 모드는 Reserved입니다. `pnpm build && pnpm start`는 빌드된 Express bundle 실행을 확인할 수 있지만, 외부 auth/storage/scheduler 설정과 봇 autostart 여부를 먼저 확인하세요. 관리형 프로젝트 checkpoint는 운영 rollout을 유발할 수 있습니다. **이번 인수인계 커밋은 문서/참조 보강이므로 새 checkpoint·운영 재배포를 만들지 않습니다.** 기능 배포일 때만 기존 관리 수단을 사용하고 fresh browser assets·공개 페이지·private/admin 경계를 확인하세요. voice 재시작/실제 테스트는 별도 운영자 권한으로 수행합니다.
