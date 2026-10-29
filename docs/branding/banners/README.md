# Graceway Church Service Banner

This directory documents the current print package for the banner displayed at the rented St. Anne Episcopal Church location before Graceway worship. The binary banner masters are intentionally excluded from Git because of their size; keep them in project File Storage or the local print-production workspace and use this README as the tracked specification.

## Deliverables

- `graceway-church-service-banner-source.png` — original supplied artwork, preserved as the source reference in File Storage.
- `graceway-church-service-banner-63.5x38.7in.svg` — self-contained vector container with the supplied artwork embedded and no crop to the original design; preserved in File Storage.
- `graceway-church-service-banner-150dpi.png` — print raster at **9525 × 5805 px**, corresponding to **63.5 × 38.7 inches at 150 DPI**; preserved in File Storage.

The source artwork is 3:2, while the sign is approximately 1.6408:1. The print master preserves the complete supplied artwork and uses an artwork-derived dark navy extension at the left and right edges rather than cropping the logo, service times, or website address.

The banner currently displays:

- Graceway Baptist Church / 그레이스웨이 침례교회
- Sunday 12:30PM & 1:30PM
- graceway-baptist.org

For production, send the SVG master to the printer when supported; otherwise use the 150 DPI PNG and confirm that the print provider keeps the canvas at 63.5 × 38.7 inches without additional cropping.

The repository `.gitignore` excludes `*.png` and `*.svg` in this directory to prevent accidental re-adding of these large binaries. Do not commit replacement copies; upload them to project File Storage instead.
