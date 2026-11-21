---
name: graceway-maintenance
description: Graceway Baptist Church 저장소의 기능 수정, 운영 장애 점검, 새 채팅 인수인계, 검증 및 Git 동기화에 사용한다. 묵상·기도·private 노트, Discord 문단 TTS, 주보·YouTube·갤러리 및 외부 저장소의 기존 동작과 안전 경계를 유지한다.
---

# Graceway 유지보수

## 작업을 시작하기

저장소 루트의 `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`, `docs/operations/development-and-restoration.md`, 관련 코드와 테스트를 읽는다. 현재 `git status`와 branch를 확인하고 `todo.md`에 이번 변경의 체크리스트를 추가한다. 이 skill은 프로젝트용으로 새로 작성한 절차이며 특정 플랫폼의 내부 tool/skill을 필요로 하지 않는다.

## 변경을 분류하기

- **문서·컨텍스트 보관**: 실제 코드·사용자 결정에서 사실을 기록하고 과거 상태와 현재 기준을 구분한다. 비밀정보 검사 후 커밋/푸시하되 운영 재배포는 하지 않는다.
- **공개 UI**: 기존 navigation·브랜드·양언어를 유지하고 tRPC hooks를 사용한다. loading/empty/error 및 desktop/mobile을 함께 확인한다.
- **데이터/권한**: 공개 콘텐츠와 회원별 private 기록을 구분한다. administrator mutation의 `adminProcedure`와 private note owner filtering을 유지한다. migration SQL을 검토하고 승인된 DB에만 적용한다.
- **Discord**: `docs/operations/discord-tts.md`를 먼저 읽는다. local duplicate bot·실제 음성 송출·재시작 없이 코드/worker 회귀 검증부터 한다. 운영 송출은 담당자의 동의를 확인한다.
- **메일·동기화**: dry run·read-only·내부 수신자 테스트를 우선한다. 구독자 일괄 발송·외부 서비스 설정·삭제는 별도 사용자 권한을 확인한다.

## 회귀를 방지하기

기도는 기존 `content/contentEn`에서 읽고 성경 본문 직후·나눔 직전에 표시한다. private QT 메모를 기도와 혼동하지 않는다. transcript는 semantic blank line 문단, 최대 2,000자 한 요청/한 resource, 다음 문단 수동 클릭이다. 실시간 Discord 텍스트의 sentence pipeline은 별도다. Dennis/rate1.1/temperature1.1, buffered Opus20ms, fade6/12ms, encoder tail60ms, Reserved 운영 기준을 임의로 바꾸지 않는다.

뉴스레터는 Sunday09:00 `America/Los_Angeles`, DST gate·발송 deduplication·confirmation/unsubscribe/bounce를 유지한다. YouTube 원본 기록과 수동 metadata를 보존하고, Photos Picker 초안은 명시적 승인 전 공개하지 않는다.

## 검증하고 인수인계하기

`pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm build`를 실행한다. 새로운 로직에 회귀 테스트를 추가하고 UI 변경에 실제 responsive 검토를 수행한다. 인수인계/산출물 변경은 `python3 scripts/artifacts/audit_handoff.py`로 문서 링크·manifest·금지 파일을 확인한다. public repository staged diff를 secret scanner로 검사한다.

`git add`는 검토한 파일에만 사용한다. remote main을 fetch해 원격 변경을 확인하고 force push 없이 커밋/푸시한다. DB dump, `.env`, keys, sessions, 사용자 transcript, mailbox, 원시 브라우저/도구 로그, 플랫폼 내부 지침은 커밋하지 않는다. 큰 media는 외부 저장소와 manifest로 보존한다.

Git push와 배포를 구분한다. 기능 배포에 기존 managed checkpoint/배포 수단을 사용하고 운영 UI·asset version을 확인한다. 문서만 변경했으면 음성 봇을 방해할 재배포를 피한다. 완료 시 실제 검증·commit hash·보존된 산출물·외부 복원이 필요한 항목을 명확히 보고한다.
