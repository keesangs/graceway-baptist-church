# 환경변수 목록 — 값은 별도 보관

이 문서는 **값이 없는 설정 참조**이며 실행 가능한 `.env` 파일이 아닙니다. 실제 프로젝트 secret·기존 환경값을 변경하지 않았습니다. 관리형 환경에서는 프로젝트 secret 설정 흐름을 사용하고, 새 로컬 환경에서는 승인된 개발용 값만 별도 `.env`에 입력하세요. 실제 키·토큰·DB URL은 public Git에 넣지 않습니다.

## 최소 실행 구성

| 변수 | 개발 기준/입력 대상 |
| --- | --- |
| `NODE_ENV` | `development` |
| `PORT` | 필요하면 `3000`; 서버 시작 로그의 실제 포트 확인 |
| `DATABASE_URL` | 승인된 개발 DB 연결 문자열, 값은 별도 secret |
| `JWT_SECRET` | 개발용 session signing secret |
| `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` | 승인된 앱/OAuth 환경 및 callback origin |
| `OWNER_OPEN_ID` | 승인된 ownership 설정; 관리자 역할을 우회하는 값으로 사용하지 않음 |
| `DISCORD_TTS_BOT_ENABLED`, `DISCORD_TTS_BOT_AUTOSTART` | **새 로컬 환경에서는 모두 `false`** 권장. 운영 봇 설정을 바꾸라는 뜻이 아님. |
| `DEEPINFRA_TTS_ENABLED` | 개발에서 실제 합성을 사용하지 않을 때 `false` |
| `INWORLD_TTS_SPEAKER` | 현재 기본값 `Dennis`; 저장된 preferences가 있으면 이를 우선하는 현행 코드 확인 |

## 제공자·기능별 이름

- 객체 저장소: `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`. 서버 키를 VITE key로 복사하지 않습니다.
- 사이트 표시/분석: `VITE_APP_TITLE`, `VITE_APP_LOGO`, `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`; 일반 clone에서 platform injection을 가정하지 않습니다.
- 메일: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`.
- 영상/성경/주보: `YOUTUBE_DATA_API_KEY`, `YOUVERSION_API_KEY`, `GOOGLE_DRIVE_BULLETIN_FOLDER_ID`.
- Photos OAuth: `GOOGLE_PHOTOS_CLIENT_ID`, `GOOGLE_PHOTOS_CLIENT_SECRET`, `GOOGLE_PHOTOS_REDIRECT_URI`.
- Discord: `DISCORD_BOT_TOKEN`, `DISCORD_TRANSLATION_GUILD_ID`, `DISCORD_TRANSLATION_TEXT_CHANNEL_ID`, `DISCORD_TRANSLATION_VOICE_CHANNEL_ID`, `DISCORD_TRANSLATION_ALLOWED_USER_ID`.
- 실제 원격 TTS: `DEEPINFRA_API_KEY`, `DEEPINFRA_TTS_REMOTE_URL`.
- 선택적 legacy/도구 override: `QWEN_TTS_REMOTE_URL`, `QWEN_TTS_REMOTE_FORMAT`, `QWEN_TTS_REMOTE_TIMEOUT_MS`, `QWEN_TTS_SPEAKER`, `QWEN_TTS_INSTRUCT`, `FFMPEG_PATH`, `ESPEAK_NG_PATH`.
- 테스트 산출물: `DEEPINFRA_TEST_TEXT`, `DEEPINFRA_TEST_OUTPUT`; 실제 API 호출이 있는 스크립트를 일반 unit test로 오해하지 않습니다.

값을 전달받지 못한 기능은 정상 연동을 검증할 수 없습니다. 이에 대한 빈 화면·로그인/스토리지 실패를 코드나 artifact 누락으로 단정하지 마세요. [복원 runbook](development-and-restoration.md)을 함께 읽으세요.
