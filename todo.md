

## Latest Updates — October 31, 2026
- [x] YouTube sync: mark records missing from the official playlist as hidden without deleting history
- [x] Admin video maintenance: add an admin-only stale/hidden video cleanup view and safe bulk actions
- [x] Shared date ordering: centralize sermon and worship service-date parsing/sorting in one utility
- [x] Verification: add authorization, sync, cleanup, ordering, responsive UI tests, then run full validation and checkpoint

## Newsletter Branding — November 1, 2026
- [x] Match newsletter footer social link icons to the homepage footer treatment
- [x] Change the newsletter header label to “그레이스웨이 Weekly Newsletter”
- [x] Verify the attached-email regression contract, full tests, build, and preview

## Newsletter Email Rendering — November 8, 2026
- [x] Replace inline SVG social links with email-safe hosted icon images and accessible text fallback
- [x] Use a dark-logo/light-background event image treatment and explicit light-mode email colors
- [x] Re-send an internal test only after rendering tests and production validation pass

## Genuine Social Icons — November 8, 2026
- [x] Replace generic outline icons with genuine platform-style Instagram, YouTube, and Facebook PNG icons
- [x] Add visible English platform labels under the email icons and validate hosted assets
- [x] Re-send an internal test after the genuine icon update is validated

## Discord Qwen Live Worship TTS — November 17, 2026
- [ ] Confirm a Qwen-capable persistent worker host; current WebDev runtime is capped at 1 vCPU/512 MB and is not suitable for Qwen3-TTS 1.7B
- [ ] Add the standalone authenticated Qwen worker service and health/synthesis smoke tests
- [ ] Add WebDev remote Qwen HTTP/WebSocket adapter with timeout, queue, engine labeling, and strict/fallback policy
- [ ] Add authenticated Discord bot integration for Kee's configured text channel and voice playback
- [ ] Add admin dashboard status, worker health, queue/history, speaker/style/speed, and start/pause/stop controls
- [ ] Run end-to-end worker and five-message Discord playback validation, then save checkpoint

## DeepInfra Remote TTS Foundation — November 17, 2026
- [x] Register `DEEPINFRA_API_KEY` as a server-only WebDev secret and validate it against DeepInfra's models endpoint
- [x] Add DeepInfra Qwen3-TTS provider handling with WAV/JSON audio parsing, timeout, and local fallback status tracking
- [x] Add and execute a short-text audio generation script; verify the returned WAV with ffprobe
- [x] Add admin-only `/admin/discord-tts` controls for remote enable/disable, write-only session key rotation, speaker/style settings, and two-second live engine status polling
- [x] Run focused tests, full Vitest suite, TypeScript validation, production build, and restart the development server
