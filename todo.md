# Graceway Baptist Church — Project TODO

## Completed
- [x] Initial website scaffold (Home, About, Sermons, Ministries, Connect pages)
- [x] KO/EN language toggle via LanguageContext
- [x] Real church info: Sunday 1:30 PM, Wednesday 8:00 PM, 2791 Driscoll Rd Fremont CA, +1 510-529-5636
- [x] Real YouTube sermon videos from @keesangs channel
- [x] College Campus Ministry (replaced Children's Ministry)
- [x] Footer & Navbar logo unified to new G+cross symbol
- [x] Full-stack upgrade (web-db-user): tRPC + Drizzle ORM + MySQL + Manus Auth
- [x] media_files DB table (schema + migration applied)
- [x] server/db.ts: insertMediaFile, listMediaFiles, deleteMediaFile helpers
- [x] server/routers.ts: media.list (public), media.upload (protected), media.delete (admin)
- [x] S3 file storage integration via storagePut
- [x] MediaLibrary page (/media): upload UI, category filter, file list, delete (admin only)
- [x] Navbar: Media link added (KO: 미디어 / EN: Media)
- [x] Leadership profile photos: real photos for Pastor Hunsuk Lee and ShinYoung Kim
- [x] Leadership profile photos: subtle hover zoom effect (scale 110%, 500ms ease-out)
- [x] Hero section: 은혜의 강물 looping muted video background (S3-hosted, 1.4MB, poster frame, navy overlay stack)
- [x] Connect page: real interactive Google Map with geocoded marker + InfoWindow
- [x] Fixed Map.tsx proxy loader: fetch+Blob URL (script tags send no Origin header, which the proxy requires)
- [x] newsletter_subscribers + contact_messages DB tables (schema + migration applied)
- [x] Newsletter signup wired to backend: newsletter.subscribe (public, idempotent by email), newsletter.list (admin)
- [x] Connect contact form wired to backend: contact.submit (public), contact.list (admin)
- [x] Server-side trim before email format validation (autofill/mobile trailing-space bug caught by tests)
- [x] Vitest: 17 tests passing (auth.logout, media, newsletter, contact) — now 19 after adding notification tests

## Pending
- [x] Sermon cards: all 9 real sermon titles and scripture references applied (Home latest 3 + Sermons page all 9); data supplied by church via chat
- [x] Admin inbox UI at /admin: Messages tab (contact_messages) + Subscribers tab (newsletter_subscribers), Export CSV, Refresh; admin-only access gate in both frontend and backend
- [x] Admin-only Inbox link in Navbar (desktop + mobile), visible only when user.role === "admin"
- [x] Email/push notification to church staff on each contact form submission via notifyOwner(); graceful degradation if notification service is down
- [x] Vitest: 20 tests passing (3 new notification tests: alert details, throw fallback, false-return fallback)
