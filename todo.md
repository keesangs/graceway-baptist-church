
## Discord Request-Abort Recovery — November 17, 2026
- [x] Start Discord voice login and UDP discovery in the server background instead of awaiting it in the dashboard HTTP mutation
- [x] Make manual reconnect/retry request-independent and report progress through status polling
- [x] Add abort diagnostics, run full validation, and save a checkpoint
