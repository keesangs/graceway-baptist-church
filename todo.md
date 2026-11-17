
## Discord Voice Reconnect Repair — November 17, 2026
- [x] Allow retry when the connection failed before any sentence was queued
- [x] Add a clear connection-specific retry label and keep the action enabled for `connection_unavailable`
- [x] Add reconnect teardown backoff and up to three retry attempts for transient Discord gateway/UDP races
- [x] Run full validation (67 files, 239 tests, TypeScript, production build) and save the updated checkpoint
