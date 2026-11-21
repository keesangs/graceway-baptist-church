# 프로젝트 컨텍스트 / Current project context

**정리 기준: 2026-11-21.** 이 문서는 현재 저장소와 사용자 확인을 요약합니다. 실제 운영 상태는 시간이 지나면 바뀔 수 있으므로, 아래 검증 날짜를 현재 상태 보장으로 오해하지 마세요. 실행 진입점은 [CLAUDE.md](../CLAUDE.md), 세부 타임라인은 [todo.md](../todo.md) 및 Git history입니다.

## 프로젝트와 연속성

기존 저장소는 `keesangs/graceway-baptist-church`, 정규 공개 사이트는 `https://graceway-baptist.org`입니다. `www` 및 Manus 도메인 연결은 기존 설정을 유지합니다. 새로운 저장소나 호스팅을 만드는 것이 이번 인수인계의 목적이 아닙니다.

2026-11-21 GitHub 점검 시 로컬과 원격 `main`은 모두 **b10db9c7** 코드 체크포인트까지 같았습니다. 따라서 최근 코드가 사라진 것이 아니라 컨텍스트 진입점·운영 설명·외부 제작 자료 색인이 부족했던 상태입니다. 이번 문서 커밋은 그 공백을 보완하며, 운영 웹사이트를 재배포하지 않습니다. 이후 변경은 Git history와 이 문서/작업 기록을 함께 갱신하세요.

## 최근 변경과 확정 기준

| 변경 | 마지막 코드 기준 | 유지할 동작 |
| --- | --- | --- |
| 오늘의 기도 | b10db9c7, 2026-11-20 검증 | 기존 administrator `content`/`contentEn`을 성경 본문 다음·묵상 나눔 바로 앞에 표시. plain React text, 줄바꿈, 빈 섹션 숨김, 선행 중복 제목 제거, 기존 양언어 fallback. 관리자가 추가/수정하면 공개 목록 cache invalidation. DB migration 없음. |
| 수동 transcript 한 문단 송출 | 2d0abaf6 | line wrap은 공백으로 이어 붙이고 blank line은 문단 경계. 한 문단을 Inworld 한 요청/오디오 한 리소스로 전송. 2,000자 초과는 거부하고 자동 쪼개기/잘라내기 금지. 다음 문단은 자동 송출하지 않음. |
| transcript 파일/붙여넣기 | d78736b3 | `.txt/.md/.docx/text-PDF`, private 파싱 결과·진행도 저장, UUID 중복 방지·재송출 확인·중단·실패 후 나머지 문단 정지. 스캔 PDF OCR은 별도. |
| voice picker·세밀 조정 | c31179e5 | 검증 당시 127 preset, account custom voices 병합 가능. Dennis/rate1.1/temperature1.1. 선택·슬라이더 저장, DB 재시작 복원. temperature는 감정 명령이 아니라 변동성. |
| 잡음과 연결 안정화 | 6e42f16b 이후 유지 | buffered worker Opus20ms, fade6/12ms, encoder tail60ms, gateway Ready 대기 및 실패 client 교체. 2026-11-18 사용자가 '잡음이 없어졌어요' 확인. |
| Reserved 전환 | 2026-11-18 사용자 승인 | 지속 운영 인스턴스 사용. Autoscale 당시 packet read gap이 크게 관측됐고 Reserved에서 개선. 영구 무손실/모든 네트워크 문제 해결을 보장하지 않음. |

2026-11-20 최종 검증은 **80 test files / 414 tests**, TypeScript와 production build 통과입니다. 운영의 실제 Nov20 기도 표시·순서·영어 heading/fallback·가로 넘침을 확인했고, 비교한 **93개** 공개 묵상 `content`/`contentEn` 기록이 변경되지 않았습니다. 이 숫자는 당시 검증 자료이지 현재 DB 크기를 고정하는 요구사항이 아닙니다.

## 주요 코드와 테스트 지도

| 영역 | 주요 코드 | 기존 근거·문서 |
| --- | --- | --- |
| 라우팅·언어·인증 | `client/src/App.tsx`, `contexts/LanguageContext.tsx`, `_core/hooks/useAuth.ts`, `client/src/const.ts`, `server/_core/context.ts` | auth/logout 및 navbar/auth 테스트. 관리자 gate와 OAuth recovery 유지. |
| 묵상·기도·private 노트 | `pages/Meditation.tsx`, `pages/AdminDailyBible.tsx`, `lib/meditationPrayer.ts`, `lib/meditationNotes.ts`, `server/routers.ts`, `server/db.ts` | `server/meditation-prayer.test.ts`, meditation-notes 및 likes/comments 테스트. |
| Discord TTS | `server/discordBot.ts`, `discordTts.ts`, `discordAudio.ts`, `discordTranscript.ts`, `discordTranscriptParser.ts`, `discordTtsPreferences.ts`, `shared/discordTranscriptFeed.ts` | [Discord 운영](operations/discord-tts.md), [voice controls](inworld-voice-controls.md), `discord-*.test.ts`. |
| YouTube | `server/youtube.ts`, `client/src/lib/serviceDate.ts`, `client/src/lib/sermonDisplay.ts`, 설교/찬양 페이지, 관리자 sync·cleanup | 기존 YouTube speaker/scripture 문서, `youtube-*.test.ts`. |
| 뉴스레터·문의 | `newsletterSubscription.ts`, `newsletterSubscriptionEmail.ts`, `weeklyNewsletterDelivery.ts`, `weeklyNewsletterDeliveryWebhook.ts`, `weeklyNewsletterSync.ts`, `weeklyNewsletterScheduledHandler.ts`, `contactEmail.ts` | delivery/subscription/webhook 테스트, 기존 뉴스레터 운영 문서. |
| 행사·갤러리 | `eventOccurrences.ts`, `googlePhotos.ts`, `googlePhotosRoutes.ts`, 관리자 및 공개 페이지 | iPad responsive 검증, gallery/Photos Picker 문서·테스트. |
| 미디어·정규 도메인 | `server/storage.ts`, `server/_core/storageProxy.ts`, `canonicalDomain.ts` | 기존 domain audit/verification 및 brand manifests. |

> 표의 지도는 검색 출발점입니다. 오래된 파일 경로·디자인 계획이 현재 구현과 다르면 현재 소스와 테스트를 우선하세요.

## 유지해야 할 교회 콘텐츠 결정

설교자 description에 `설교자:` 별도 줄을 사용합니다. 줄이 없으면 이헌석 목사로 처리하는 정책이며 영문 표기는 **Pastor Hunsuk Lee**, **Staff Pastor MyeongJe Cho**입니다. 새 교회 YouTube 채널 `@Graceway-Baptist`의 동기화는 2026-09-20 이후 업데이트에 적용하고 기존 설교·찬양 기록은 보존합니다. 삭제된 playlist 항목은 숨김 처리하며 날짜 정렬·대표 카드 로직을 유지합니다.

공식 공개 채널은 Facebook `https://www.facebook.com/people/Graceway-Baptist-Church/61594452553986/`, Instagram `https://www.instagram.com/gracewaybaptistchurchfremont`, YouTube `https://www.youtube.com/@Graceway-Baptist`입니다. 홈페이지 아이콘 hover/모바일 링크와 이메일용 raster 아이콘은 별도 표현입니다. 주보 상단 제목은 **그레이스웨이 Weekly Newsletter**이며, 이메일 footer의 주소는 영문 주소, 예배 시간은 양언어 표현입니다. 이메일에서 inline SVG/data URI가 깨졌던 이력이 있어 공개 HTTPS raster 이미지와 배경 대비를 유지하세요.

교회는 St. Anne Episcopal Church 건물을 빌려 사용합니다. 인쇄 배너는 **63.5 × 38.7 inches**, 150 DPI raster **9525 × 5805 px**이며 원본 이미지를 보존한 SVG container입니다. 과거 배너 문구의 12:30PM/1:30PM은 해당 artwork 기록이며 현재 예배 일정을 임의로 변경하는 근거가 아닙니다. 브랜드는 navy `#17324D`, way blue `#2F6F9F`, warm gold `#C9973E`, light `#F4F6F7`, charcoal `#242A30`; 승인된 dark/light 로고는 `docs/branding/logos/` 및 manifests에 있습니다.

## 현재 알려진 경계와 과거 판단의 교정

전체 웹사이트를 Git만으로 **코드 유지보수**할 수 있도록 구성하지만, 운영 DB 데이터·외부 객체 저장소·DNS/MX·Google Workspace/Photos OAuth·Resend domain/webhook·예약 서비스·Discord 권한/토큰은 별도입니다. 비밀정보나 회원 기록을 public Git에 넣어 이를 해결하지 마세요.

과거 로그에서 Discord Idle 상태가 원인이라는 단정은 교정됐습니다. 설치된 voice library의 실제 상태 전이와 measured diagnostics를 보세요. 초기 UDP failure가 있었다고 플랫폼 전체 UDP 차단으로 단정하지 마세요. Python urllib의 HTTP403이 발생했으나 curl/브라우저는 성공한 사례도 있습니다. 서버 packet gap/underflow 측정은 수신자의 packet loss나 주관적 음질과 동일하지 않습니다.

원시 대화·브라우저 캡처·도구 출력에는 credentials 또는 개인자료가 섞일 수 있어 public archive로 복사하지 않았습니다. 프로젝트 결정과 검증 증거는 이 문서, `todo.md`, 기존 docs 및 commit messages로 인수인계합니다. 사용자 제공 이전 설계 파일은 provenance를 붙여 archive에 보존하되 현행 운영 지침으로 사용하지 않습니다.
