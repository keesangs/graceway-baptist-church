
## Discord Audio Stutter — November 17, 2026
- [x] Wait for AudioPlayer Playing before waiting for Idle to prevent resources being overwritten early
- [x] Feed converted PCM as one explicit stream chunk and add regression coverage
- [x] Run real conversion, full validation, and save a checkpoint
