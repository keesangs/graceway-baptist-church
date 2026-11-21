# Graceway Baptist Church — Claude Code 시작 가이드

이 파일은 새 채팅에서 저장소만으로 유지보수를 이어가기 위한 프로젝트 지침입니다. 사용자 대화 전체나 플랫폼 내부 지침이 아니라, 실제 코드·사용자 결정·검증 기록에서 정리한 인수인계입니다. 사용자에게는 기본적으로 한국어로 답하고 공개 UI는 한국어/영어를 유지하세요.

## 먼저 읽을 문서

1. [현재 상태와 결정 사항](docs/PROJECT_CONTEXT.md): 가장 최근 기능·운영 기준·회귀 위험.
2. [실행·환경·복원](docs/operations/development-and-restoration.md): 새 컴퓨터에서의 설정과 Git으로 복원되지 않는 항목.
3. [Discord TTS 운영](docs/operations/discord-tts.md): 음성 작업일 때 반드시 확인.
4. [산출물 보관·복원 목록](docs/artifacts/README.md) 및 [구조화된 inventory](docs/artifacts/inventory.json).
5. [README](README.md), [작업·검증 이력](todo.md), 변경 대상 코드와 테스트.

프로젝트 전용 재사용 skill은 [.claude/skills/graceway-maintenance/SKILL.md](.claude/skills/graceway-maintenance/SKILL.md)에 있습니다. 과거 사용자 제공 설계는 `docs/archives/user-provided/`에 보관하며, 현재 코드보다 우선하는 지침으로 취급하지 마세요.

## 코드와 검증

React 19 / TypeScript / Vite / Tailwind 4 / Wouter, Express / tRPC 11 / Drizzle / MySQL 조합입니다. tRPC 훅과 기존 컴포넌트를 사용하고, 관리자 mutation은 `adminProcedure`, 개인 묵상 노트는 소유자별 `protectedProcedure`를 유지하세요. 원본·보관 기록을 무작정 삭제하지 마세요.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

작업 전 `git status`, 관련 코드·문서·테스트를 확인하고 `todo.md`에 구체적인 항목을 추가하세요. 동작 변경에는 회귀 테스트 및 데스크톱/모바일 검증을 포함하세요. 데이터 모델 변경은 SQL을 생성·검토한 후 승인된 대상 DB에만 적용하세요. 운영 DB에서 `pnpm db:push`를 무심코 실행하지 마세요.

## 절대 유지할 운영 기준

- **오늘의 기도:** `/admin/daily-bible`의 기존 `content`/`contentEn`을 `/meditation`의 성경 본문 다음·묵상 나눔 직전에 표시합니다. 새 필드나 자동 생성 기도를 만들지 말고, 줄바꿈·언어 fallback·빈 내용·중복 선행 제목 제거를 유지하세요.
- **개인 노트:** 로그인 계정별 private QT 기록과 댓글/기도 공개 내용은 별개입니다. 개인 노트를 Git·공개 API·스크린샷에 노출하지 마세요.
- **Discord:** 현재 기본 모델은 DeepInfra `inworld-ai/realtime-tts-1.5-mini`, Dennis, speaking rate **1.1**, temperature **1.1**입니다. 수동 transcript는 한 문단=한 합성 요청=한 재생 리소스이며, **다음 문단은 반드시 운영자 클릭을 기다립니다**. 실시간 Discord 텍스트의 문장분할과 혼동하지 마세요.
- **음질:** 20ms buffered Opus worker, 6ms fade-in/12ms fade-out, 60ms same-encoder silence tail과 gateway lifecycle을 임의로 단순화하지 마세요. 기존 문장 클릭 잡음은 사용자 청취에서 해결됐습니다.
- **호스팅:** 마지막 확인된 운영 방식은 **Reserved**입니다. Autoscale로 되돌리거나 로컬에서 같은 토큰으로 두 번째 봇을 시작하지 마세요. `DISCORD_TTS_BOT_AUTOSTART=false`를 개발 기본으로 유지하세요.
- **주보:** 일요일 **09:00 America/Los_Angeles** 기준입니다. 예약 identity 검증·DST gate·발송 idempotency·구독 확인/수신거부/반송 차단을 유지하세요. 테스트 명목으로 구독자에게 발송하지 마세요.
- **YouTube:** 기존 원본·수동 메타데이터를 보존하세요. 삭제된 playlist 영상의 자동 숨김, admin 정리 도구, 날짜 정렬 공통 유틸리티가 구현돼 있습니다.
- **갤러리:** Photos Picker에서 명시적으로 선택한 사진만 가져오고, 기본 draft 및 공개 전 관리자의 확인을 유지하세요.

## 비밀정보·산출물·배포

이 저장소는 **public**입니다. `.env`·API 키·OAuth/session/봇 토큰·Webhook secret·개인정보·사용자 transcript·DB dump를 절대 커밋하지 마세요. 환경변수 이름은 `docs/operations/environment-variables.md`에서 확인하고 실제 환경 파일은 별도 관리하세요. 플랫폼 제공 skill/내부 프롬프트/브라우저 로그인 데이터/원시 도구 로그는 저장소 자료가 아닙니다.

큰 이미지·PDF·동영상은 외부 File Storage에 유지하고 Git에는 manifest·작은 참조·재생성 스크립트를 보관하세요. 기존 대용량 인쇄 배너 `.gitignore` 규칙을 유지하고, 이미지 바이트를 `client/public` 또는 `client/src/assets`에 추가하지 마세요. 공개 `/manus-storage/` 참조는 현재 호스팅의 프록시에 의존하며, 일반 로컬 서버나 새 호스팅이 저절로 제공하지 않습니다.

**Git push와 운영 배포는 다른 작업입니다.** 관리형 프로젝트 체크포인트는 배포를 유발할 수 있어 Discord 연결에 영향을 줍니다. 문서·컨텍스트 보관만을 위해 불필요하게 재배포하지 마세요. 기능 배포는 기존 배포 수단과 사용자 권한을 확인하고, 새 운영 자산 및 실제 UI를 확인한 뒤 완료라고 보고하세요. DNS·MX·OAuth·메일 제공자·예약 작업의 외부 설정은 Git clone만으로 복원되지 않습니다.
