# Production Domain Routing Verification

## 2026-09-17 initial production check

`https://graceway-baptist.org/` returned the Graceway production site over HTTPS.

`https://graceway-baptist.manus.space/events?month=2026-09` initially returned the production page directly with HTTP 200 rather than redirecting. The response included `x-manus-proxy-mode: transparent/1` and `x-powered-by: Express`, indicating that the request reached the deployed application but the host available to the initial redirect middleware was not the public Manus alias. The canonical redirect must therefore prefer the original forwarded host header while preserving the request path and query.

## 2026-09-17 final production check

After adding the browser-entry fallback for the two project-owned Manus aliases, a visit to `https://graceway-baptist.manus.space/events?month=2026-09` completed at `https://graceway-baptist.org/events?month=2026-09`. The Events path and `month=2026-09` query were retained. The apex custom domain therefore remains the public address shown after navigation even when a legacy Manus alias is opened directly.
