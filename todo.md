
## Initial Discord AbortError Recovery — November 17, 2026
- [x] Add a bounded automatic retry for aborted initial login/voice startup
- [x] Prevent overlapping startup attempts and expose retry progress in status
- [x] Add regression coverage, run full validation, and save a checkpoint

## Measured Discord stutter diagnosis — November 17, 2026
- [x] Validate saved original WAV and conversion structure/duration; add behavioral Opus decoding, playback, stop, and sample-preservation tests. Correct the earlier unsupported previous-Idle diagnosis.
- [x] Pre-encode complete, padded 20 ms Opus packets in a worker and buffer before playback; guard stopped/stale queue work, await actual voice readiness, subscribe once, and clear stale recovery timers.
- [x] Separate transient original/converted WAV previews from an explicit Discord playback test; expose server-side underflow, read-gap, interruption, ping, and instance diagnostics to admins only.
- [x] Validate 70 Vitest files / 253 tests, TypeScript, production build, bundled worker smoke test, and desktop/mobile admin screenshots. Same saved 3021 ms WAV: buffered resource had zero underflow and 20 ms maximum read gap in isolated local playback.
- [ ] Publish the latest checkpoint and compare original/converted browser audio with live Discord listening; no receiver-side audio has been recorded or verified, and production stutter is not yet proven resolved.

## Production voice connection diagnosis — November 17, 2026
- [x] User confirmed original and converted browser audio sound normal after publishing b9513481.
- [x] Inspected authenticated production dashboard: instance 0b8c2e76 was stopped; invoked Start once (no duplicate bot), observed initial voice-ready timeout with first automatic retry.
- [x] Observed all three automatic retries exhaust into error on the same production instance. Token login and configured guild/channel/voice permission validation reached the voice-connection stage. No further manual starts were invoked.
- [x] Inspect available devices: this session exposes only Sandbox, no authorized/attached Cloud Computer. Reserved Hosting reference reviewed; current production hosting mode and UDP capability have not been independently verified.
- [x] Add safe allowlisted voice-state/network-phase diagnostics and preserve the pre-destroy timeout stage, with bounded transition history; guard duplicate Start/Retry during automatic connection while keeping Stop enabled. TTS provider unchanged. TypeScript, 71 files / 258 tests and production build passed.
- [ ] Publish connection-phase diagnostics and read the stalled production network phase (WebSocket vs UDP discovery vs signalling); do not infer UDP blocking from AbortError alone.
- [ ] Restore a stable production voice connection or explicitly document the verified blocker and required user action; listener quality remains unverified.
