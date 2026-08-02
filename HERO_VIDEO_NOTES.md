# Hero Video Background — Implementation Notes

## Current Asset: 은혜의 강물 (River of Grace)

**Source:** User-provided `228847_medium.mp4` (Pixabay video ID 228847)
- Original: 1440x2560 portrait, 132 MB, 20.4 s, h264

**Processed output:** `client/public/hero_river.mp4`
- 960x540 landscape, 1.4 MB, 16 s, 24 fps, no audio track
- Crop applied: `crop=1440:810:0:700` — isolates the waterfall + turquoise rapids + mossy rocks band from the portrait frame
- Playback slowed 1.6x via `setpts=1.6*PTS` for a calm, meditative pace
- Encoded `libx264 -preset veryslow -crf 34 -tune film`, `+faststart` for progressive streaming

**Poster frame:** `client/public/hero_river_poster.jpg` (1280x720, 196 KB)

## Layering (Home.tsx hero section)

| Layer | Element | Purpose |
|---|---|---|
| 1 | `HERO_BG` static image div | Instant paint before video decodes |
| 2 | `<video>` @ `opacity: 0.5`, `pointer-events-none` | Living water atmosphere |
| 3 | `bg-[#17324D]/35` flat navy | Uniform tone-down of the footage |
| 4 | `bg-gradient-to-r from-[#17324D]/95 via-/62 to-/10` | Dark text side (left), water breathes (right) |
| 5 | `bg-gradient-to-t from-[#17324D]/72` | Grounds the bottom diagonal cut |
| 6 | Gold vertical accent line (left edge) | Decorative, pure CSS |
| 7 | Watermark "G" @ 7% gold | Ambient depth |

## Video element attributes (required trio for universal autoplay)

`autoPlay` + `muted` + `playsInline` — without all three, iOS Safari refuses to autoplay.
Also set: `loop`, `preload="auto"`, `poster`, `aria-hidden="true"`, `pointer-events-none`.

## Gotchas encountered

1. **`/manus-storage/` 307 redirect** — S3-backed storage paths issue a presigned-URL redirect that `<video>` does not reliably follow. Hero video must live in `client/public/` and be referenced by a root-relative path (`/hero_river.mp4`). Kept small (1.4 MB) to avoid deployment timeouts.
2. **ffmpeg `geq` positional args are `lum:cb:cr` (YCbCr), NOT `r:g:b`** — this made an earlier procedurally generated bokeh video render green instead of gold. Use named `geq=r='…':g='…':b='…'` params, or generate frames in numpy and pipe rawvideo to ffmpeg (much faster).
3. **Pixabay download-page URLs are not direct video files** — `https://pixabay.com/videos/download/x-228847_medium.mp4` is a redirect and fails silently in `<video>`. The real CDN form is `https://cdn.pixabay.com/video/YYYY/MM/DD/ID_large.mp4`. Sidestepped here since the user supplied the file directly.

## Regeneration scripts (sandbox, not in repo)

- `/home/ubuntu/optimize_river.sh` — crop + slow + first-pass encode
- `/home/ubuntu/compress_river.sh` — second-pass compression to under 3 MB
