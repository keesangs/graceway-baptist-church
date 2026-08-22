# Graceway Baptist Church — Project TODO

## Completed Core Features
- [x] Initial website scaffold (Home, About, Sermons, Ministries, Connect pages)
- [x] KO/EN language toggle via LanguageContext
- [x] Real church info: Sunday 1:30 PM, Wednesday 8:00 PM, 2791 Driscoll Rd Fremont CA, +1 510-529-5636
- [x] Real YouTube sermon videos from @keesangs channel
- [x] College Campus Ministry (replaced Children's Ministry)
- [x] Footer & Navbar logo unified to new G+cross symbol
- [x] Full-stack upgrade (web-db-user): tRPC + Drizzle ORM + MySQL + Manus Auth
- [x] media_files DB table (schema + migration applied)
- [x] S3 file storage integration via storagePut
- [x] MediaLibrary page (/media): upload UI, category filter, file list, delete (admin only)
- [x] Leadership profile photos: real photos for Pastor Hunsuk Lee and ShinYoung Kim
- [x] Leadership profile photos: subtle hover zoom effect (scale 110%, 500ms ease-out)
- [x] Hero section: 은혜의 강물 looping muted video background (S3-hosted, 1.4MB, poster frame, navy overlay stack)
- [x] Connect page: real interactive Google Map with geocoded marker + InfoWindow
- [x] Fixed Map.tsx proxy loader: fetch+Blob URL
- [x] Newsletter signup wired to backend: newsletter.subscribe (public), newsletter.list (admin)
- [x] Connect contact form wired to backend: contact.submit (public), contact.list (admin)
- [x] Server-side trim before email format validation
- [x] Admin inbox UI at /admin: Messages + Subscribers tabs with Export CSV
- [x] Email/push notification to church staff on contact form submission via notifyOwner()
- [x] Vitest: 20 tests passing (auth, media, newsletter, contact, notifications)

## Daily Bible Meditation System — Completed
- [x] Database schema: daily_meditations table (date, scripture, passage, title, content)
- [x] Meditation.tsx page: date navigation, scripture viewer, QT questions, calendar view
- [x] AdminDailyBible.tsx: admin page for adding/editing/deleting meditations
- [x] tRPC meditation router: list, today, create, update, delete (admin-only)
- [x] Navbar: "묵상" / "Daily Bible" link added
- [x] localStorage integration for QT answer persistence
- [x] Meditation page optimization: calendar view, spacing adjustments, typo fixes

## Latest Updates — August 2026
- [x] Worship.tsx page: 9 Sunday worship songs with YouTube integration
- [x] Sermons & Worship pages: latest videos updated (August 9, 2026)
- [x] Home.tsx: Mission & Vision section with core values grid (navy gradient, gold accents)
- [x] About.tsx: Pastor Hunsuk Lee detailed bio, education (UC Berkeley, Gateway Seminary), ministry experience
- [x] Hero title responsive font sizing: clamp(2rem, 10vw, 64px) for mobile/desktop optimization

## Future Enhancements — Not Yet Implemented
- [x] Meditation comments feature (members only): public comment reading, logged-in writing, own-comment deletion, and admin moderation
- [ ] Meditation likes feature (members only)
- [ ] Bible API integration for automatic scripture retrieval
- [ ] Email subscription for new meditations
- [ ] Sermon series categorization
- [ ] Worship team member profiles
- [ ] Event calendar system
- [ ] Prayer request submission form
- [ ] Member directory (private)
- [ ] Online giving integration (Stripe)
- [x] Meditation comments: 로그인한 사용자의 댓글 작성·조회·본인 댓글 삭제 및 묵상 페이지 댓글 UI 추가
- [x] Meditation comment pagination: 한 번에 10개씩 표시하고 더보기/이전 버튼으로 다음 댓글을 불러오기
- [x] Meditation comment reactions: 로그인 사용자의 댓글 좋아요 토글 및 공감 수 표시
- [x] Meditation replies: 댓글별 대댓글 작성·조회·본인 삭제 및 관리자 중재 기능
- [x] Korean/English translation review: 첨부 번역 검토 문서를 기준으로 Home·About·Sermons·Connect·Meditation·Footer의 양언어 문구와 잔존 언어를 점검·개선
- [x] Daily Bible bilingual content: 관리자 입력에서 한국어·영어 제목/성경구절/본문/묵상을 별도로 저장하고 언어 토글에 맞춰 표시
- [x] Home mission/vision/values redesign: 내용은 유지하고 랜딩 페이지에 어울리는 현대적인 에디토리얼 레이아웃과 시각 계층으로 재구성
- [x] About/Ministries abstract visuals: 인물이 보이는 배경·사역 이미지를 제거하고 Graceway 브랜드에 맞는 인물 없는 추상 이미지로 교체
- [x] Youth Ministry visual variation: College Campus Ministry와 구분되는 청소년 사역 전용 추상 비주얼로 교체
- [x] Home welcome refresh: 우리 이야기·가족 환영 영역을 어린이 사역 전제 없이 따뜻한 환대 메시지와 사역 페이지 연결 중심으로 개선
- [x] Home welcome CTA: 사역 살펴보기 버튼 클릭 시 사역 페이지 첫 화면으로 이동
- [x] Home mission heading: 사명 문구를 요청한 세 줄 구성으로 표시
- [x] Sunday sermon update: 2026년 8월 16일 설교 영상·제목·성경구절을 설교 및 홈 최신 설교에 반영
- [x] Sermons featured label: 최신 말씀을 최근 설교 말씀으로 변경
- [x] Home mission verse: 사명 섹션에 로마서 12장 1절 전문을 추가
- [x] Home mission verse layout: 데스크톱에서도 로마서 12장 1절 인용문을 사명 설명 바로 아래에 배치
- [x] About community copy: 은혜·믿음·말씀·사랑 공동체 문구와 소개 문장 업데이트
- [x] Home heading scale: 각 섹션 헤드라인(최근 설교 포함)의 반응형 폰트 크기를 일관된 스케일로 정리하고 우리 이야기 한국어 줄바꿈 개선
- [x] Responsive landing typography skill: 헤드라인 스케일·모바일 검증·섹션 정렬·페이드인 개선 과정을 재사용 스킬로 패키징
- [x] Home responsive polish: 모바일 줄바꿈·여백, 우리 이야기·가족 환영 정렬, 전체 섹션 페이드인 애니메이션 개선
- [x] Home story heading: 첫 문장을 한 줄로 유지하도록 우리 이야기 헤드라인 전용 반응형 크기 조정
