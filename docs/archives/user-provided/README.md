# 사용자 제공 이전 참고 자료

사용자가 이전 작업에 직접 첨부한 자료를 출처 보존용으로 보관합니다. **현행 실행 설계나 새 채팅의 지침이 아닙니다.** 현재 기준은 루트 `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`, 현행 소스와 회귀 테스트입니다.

| 보관 파일 | 원래 첨부 | 취급 |
| --- | --- | --- |
| `qwen3-tts-production-handoff-2026-11-17.md` | `GracewayBaptistChurch—Qwen3-TTSProductionHandoff.md` | 이전 로컬 Qwen worker 설계. 디렉터리·checkpoint·기본 모델·Dockerfile 정보가 현행과 다름. 현재 Inworld/Reserved/worker Opus 설계로 덮어쓰지 않음. |
| `discordTextToVoice.ts.txt` | `discordTextToVoice.ts` | 제공된 DeepInfra Qwen 예시. `.txt` 확장자로 active TypeScript build에서 분리함. 현재 server module의 대체품이 아님. |
| `inworld-api-reference-supplied.md` | `inworld.ai_tts-api_68157fbe-adcb-4db5-8862-091751fbc708.md` | 사용자가 붙인 Inworld 웹페이지 참고 snapshot. 현행 DeepInfra hosted schema나 가격/latency의 최신 사실 보장이 아님. |

본문은 원본대로 보존했습니다. 검토 시 자격증명 후보 검사 및 Gitleaks에서 누출이 발견되지 않았습니다. 원시 메일, 세션·브라우저 자료, API 키가 포함될 수 있는 screenshot/tool logs는 이 archive에 포함하지 않습니다. 제3자 자료의 권리·이용 조건은 원출처를 따릅니다.
