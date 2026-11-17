
## Discord Initial Connection Diagnostics — November 17, 2026
- [x] Preserve the underlying initial voice connection error instead of replacing it with a generic message
- [x] Add regression coverage for initial connection diagnostics and verify production build
- [ ] Evaluate moving the Discord UDP voice runtime to a persistent worker with stable outbound UDP
