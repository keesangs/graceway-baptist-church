
## Native Discord Audio Conversion — November 17, 2026
- [x] Add a Node-native WAV/PCM converter so standard DeepInfra Discord playback does not require ffmpeg
- [x] Keep ffmpeg as an optional fallback for unsupported audio containers and the local eSpeak fallback
- [x] Reproduce the exact sentence without ffmpeg, run full validation, and save a checkpoint
