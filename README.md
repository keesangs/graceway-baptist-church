# Graceway Baptist Church

> **말씀으로 세워지고, 삶으로 예배하며, 세상으로 보냄 받는 공동체**

Graceway Baptist Church의 공식 웹사이트 프로젝트입니다. 한글과 영어를 함께 지원하며, 교회의 예배 안내, 설교·찬양 영상, 일정과 주보, 사진 갤러리, 매일 말씀 묵상, 방문·문의 흐름을 하나의 관리 가능한 웹 애플리케이션으로 제공합니다.

**Live site:** [graceway-baptist.org](https://graceway-baptist.org)

## 새 채팅에서 이어서 작업하기

저장소 루트의 [CLAUDE.md](CLAUDE.md)를 시작점으로 사용하세요. [현재 프로젝트 컨텍스트](docs/PROJECT_CONTEXT.md), [개발·복원 runbook](docs/operations/development-and-restoration.md), [Discord 운영 가이드](docs/operations/discord-tts.md), [산출물 목록](docs/artifacts/README.md), [프로젝트 전용 skill](.claude/skills/graceway-maintenance/SKILL.md)이 새 Claude Code 채팅의 연속성을 제공합니다. 실제 keys·private DB·외부 계정/예약 설정은 Git에 포함되지 않습니다.

## Overview

이 프로젝트는 Graceway의 네이비·슬레이트·아이보리·절제된 골드 브랜드 체계를 바탕으로 제작된 반응형 웹사이트입니다. 공개 방문자는 예배와 공동체 정보를 탐색하고, 최신 설교와 찬양 영상을 시청하며, 행사·주보·갤러리를 확인할 수 있습니다. 관리자는 인증된 관리 화면에서 말씀 묵상, 행사, 주보, 사진, 문의 및 YouTube 콘텐츠 동기화를 운영합니다.

| 영역 | 제공 기능 |
| --- | --- |
| 공개 웹사이트 | Home, 소개, 사역, 설교, 찬양, 일정·행사, 갤러리, 묵상, 방문·문의, 미디어 |
| 설교·찬양 | YouTube 플레이리스트 수동 동기화, 최신순 아카이브, 영상 공유, 설교 날짜·제목·본문 메타데이터 표시 |
| 일정·주보 | 공개 행사 캘린더, 반복 일정, 유형 필터, 추천 행사 카운트다운, Google Calendar 추가, PDF 주보 미리보기·보관함 |
| 묵상 | 날짜 탐색, 성경 본문·오늘의 기도·나눔, 계정 연동 private QT 노트, 댓글·답글·공감, 양언어 콘텐츠 |
| 갤러리 | 앨범·사진 공개 상태 관리, 접근 가능한 뷰어, 수동 업로드, Google Photos Picker 선택 가져오기 |
| 관리자 운영 | 문의·구독자 목록, Daily Bible 관리, 행사 CRUD, 주보 동기화·발행, YouTube 재동기화, 갤러리 일괄 관리 |
| Discord voice | DeepInfra Inworld, Dennis/rate1.1/temperature1.1, voice picker, 수동 transcript 문단별 한 요청 송출, buffered Opus 및 진행도 저장 |

## Technology

| 계층 | 주요 기술 |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Wouter |
| UI | Radix 기반 UI 컴포넌트, Lucide 아이콘, Sonner 알림 |
| Data flow | tRPC 11, TanStack React Query, SuperJSON, Zod |
| Backend | Express 4, TypeScript |
| Persistence | Drizzle ORM, MySQL/TiDB |
| Authentication | Manus OAuth 및 역할 기반 관리자 권한 |
| File storage | S3 호환 저장소를 통한 이미지·PDF·미디어 보관 |
| Testing | Vitest, TypeScript 정적 검사 |

## Key User Flows

### Sermons and Worship

관리자는 `/admin`에서 **Sync YouTube playlists**를 실행해 설교와 찬양 플레이리스트를 동기화합니다. 공개 화면은 동기화 데이터와 교회가 관리하는 설교 제목·본문 메타데이터를 병합합니다. 같은 주일에 복수의 원본 영상이 존재할 경우, 공개 카드에는 대표 설교만 노출해 중복을 피하면서 원본 동기화 기록은 보존합니다.

### Events and Weekly Bulletins

`/events`는 관리자가 입력한 공개 일정의 단일 원본을 사용합니다. 방문자는 월간 일정, 유형 필터, 추천 행사, 개인 Google Calendar 추가 링크를 사용할 수 있습니다. 최신 주보는 왼쪽 타일에서 첫 페이지 썸네일과 함께 열람·다운로드할 수 있고, 과거 주보는 오른쪽 보관함에서 연도·월별로 탐색하고 페이지 안에서 미리볼 수 있습니다.

주보 PDF는 지정된 공개 Google Drive 폴더에서 동기화되며, 매주 **일요일 오전 9시 Pacific Time**에 자동 확인·게시하도록 구성되어 있습니다. 동기화에 실패해도 기존 공개 주보는 유지됩니다.

### Gallery and Google Photos

갤러리 사진은 관리자가 직접 업로드하거나 Google Photos Picker에서 **명시적으로 선택한 사진만** 가져옵니다. 가져온 사진은 기본적으로 초안이며, 관리자가 공개하기 전까지 방문자에게 표시되지 않습니다. 이 흐름은 사생활과 사진 사용 동의 관리를 돕습니다.

### Daily Bible Meditation

`/meditation`은 성경 본문 다음·묵상 나눔 바로 앞에 **오늘의 기도**를 표시합니다. `/admin/daily-bible`의 기존 `content`/`contentEn` 필드를 사용하며 원문·줄바꿈·언어 fallback을 유지합니다. 로그인한 사용자의 QT 노트는 계정에 private 저장되어 기기 간 연동되며, 공개 댓글·답글·공감과 분리됩니다.

### Discord TTS

`/admin/discord-tts` 및 관리자 voice runtime tile에서 영어 transcript를 올리거나 붙여넣고 **운영자 클릭으로 한 문단만** 보냅니다. 다음 문단은 자동 송출되지 않습니다. 실시간 Discord 텍스트는 별도 문장 pipeline을 유지합니다. 실제 송출·재시작·배포 전 [운영 가이드](docs/operations/discord-tts.md)를 확인하세요.

## Project Structure

```text
client/
  src/
    components/       Reusable UI, navigation, page primitives
    contexts/         Language and theme contexts
    lib/              Client utilities and tRPC client
    pages/            Public and administrative routes
server/
  db.ts               Drizzle database query helpers
  routers.ts          tRPC router contracts
  eventOccurrences.ts Event recurrence and occurrence expansion
  youtube.ts          YouTube playlist retrieval helpers
  *_handler.ts        Scheduled and feature-specific server logic
drizzle/
  schema.ts           Database schema
  migrations/         Generated migrations
storage/              File storage integration helpers
shared/               Shared constants and types
```

## Local Development

### Prerequisites

- Node.js 22 or later
- pnpm 10 or later
- Access to the managed database, OAuth, storage, and integration configuration used by the deployment environment

Do **not** commit `.env` files, OAuth secrets, API keys, service tokens, user credentials, or private Google Drive/Photos access data. In the managed environment, configuration is supplied through project secrets rather than source control.

### Install and Run

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The development server starts the Express/tRPC application and Vite frontend together. Open the local preview address emitted by the development server. Follow the restoration runbook for approved development secrets; keep Discord bot autostart disabled locally to avoid a duplicate production bot.

### Quality Checks

```bash
# TypeScript static checking
pnpm check

# Unit and contract tests
pnpm test

# Production build
pnpm build
```

### Database Workflow

When evolving the data model, keep the database schema and application code synchronized.

1. Update `drizzle/schema.ts`.
2. Generate and review the migration with Drizzle.
3. Apply approved SQL through the managed database workflow.
4. Add query helpers in `server/db.ts`.
5. Expose the necessary tRPC procedures in `server/routers.ts`.
6. Add or update Vitest coverage before deployment.

## Content Operations

| Content | Primary management path | Notes |
| --- | --- | --- |
| YouTube sermons and worship | `/admin` → playlist sync | Preserve manually curated sermon metadata; do not delete source records merely to resolve public-card duplicates. |
| Daily Bible content | `/admin/daily-bible` | Add Korean/English titles, references, passages and prayer in existing content/contentEn. |
| Church events | `/admin` → Events | Set visibility, event type, venue, recurrence, and bilingual copy. |
| Weekly bulletins | `/admin` → Bulletins | Review latest Drive sync, title, visibility, and manual retry controls. |
| Gallery albums and photos | `/admin` → Gallery | Imported Google Photos remain drafts until published. |
| Contact messages and subscribers | `/admin` | Export and review contact and subscription records. |

## Deployment

The last verified production hosting mode is **Reserved** (user-approved November 18, 2026), not Autoscale. A managed project checkpoint records the tested code state and can automatically publish a new application version, temporarily affecting the persistent Discord connection. Verify fresh public assets and applicable flows after functional deployments. Git commits/pushes and documentation handoffs are distinct from deployment: do not redeploy the bot just to archive context or completion notes.

## Security and Privacy

- Administrative procedures require authenticated administrator access.
- Public procedures return only published content; drafts, cancellations, and administrator-only data remain restricted.
- Binary files are stored in object storage, while the database stores metadata and access-relevant records.
- Google Photos importing is manual selection only, and gallery publishing remains an explicit administrator action.
- Never place credentials, access tokens, user records, or personally identifiable information in this repository or its documentation.

## Contributing

Keep changes focused, responsive, accessible, and bilingual where the public UI requires it. Reuse existing UI components and use tRPC for client-to-server data flow. For any behavior change, add or update a Vitest test, run the quality checks above, verify the applicable desktop and mobile views, then create a checkpoint.

## License

The repository metadata identifies this project as **MIT** licensed. Confirm the applicable terms for any third-party assets, hosted media, or connected integrations before reuse.
