# Google Maps Integration — Debug Notes (RESOLVED)

## Goal
Replace the text-link map placeholder on `/connect` with a real interactive map
centered on 2791 Driscoll Rd, Fremont, CA 94539.

## Finding 1 — Keyless Google Maps iframe embeds are blocked

| URL form | Result |
|---|---|
| `https://www.google.com/maps?q=ADDR&output=embed` | 404, `x-frame-options: SAMEORIGIN` |
| `https://maps.google.com/maps?q=ADDR&output=embed` | 404, `x-frame-options: SAMEORIGIN` |
| `https://www.google.com/maps/embed/v1/place?q=ADDR` (no key) | 404, `x-frame-options: SAMEORIGIN` |
| `https://www.openstreetmap.org/export/embed.html?bbox=...` | 200 text/html (viable fallback) |

Conclusion: `<iframe>` is dead. Must use the template `MapView`
(`client/src/components/Map.tsx`) which routes through the Manus Maps proxy.

## Finding 2 — The proxy requires an `Origin` header

Endpoint: `${VITE_FRONTEND_FORGE_API_URL}/v1/maps/proxy/maps/api/js?key=${KEY}&v=weekly&libraries=marker,places,geocoding,geometry`
Env in this project: `VITE_FRONTEND_FORGE_API_URL=https://forge.manus.ai`, key present.

| Request | Result |
|---|---|
| No `Origin` header (curl / node fetch) | **403** `{"error":"origin is required"}` |
| `Origin: <dev domain>` | **200** `text/javascript`, 1,423,482 bytes |
| `Origin: https://graceway-baptist.manus.space` | **200**, same bundle |

Response headers include `vary: Origin, Accept-Language, Origin, X-Origin, Referer`
and `server: APISIX/3.11.0`.

## Finding 3 — ROOT CAUSE: `<script src>` sends no Origin header

In-browser verification on the dev domain:

| Load method | Outcome |
|---|---|
| `fetch(url)` | **200**, 1,423,482 bytes, valid bundle |
| `<script src={url}>` | **`onerror` fires**, `google.maps` stays undefined |
| `fetch` → `Blob` → `<script src={blobUrl}>` | **`onload` fires, `google.maps === true`** |

Ruled out along the way:
- API key / base URL injection — `[MapDiag]` log confirmed `key present: true`,
  `base: https://forge.manus.ai`, correct `script.src`. (The debugging agent's
  `import.meta.env` hypothesis was wrong.)
- CSP — no `meta[http-equiv]` CSP tags on the page; no CSP response headers.
- `crossOrigin="anonymous"` — removing it alone did not fix anything.

A classic `<script src>` load is a no-CORS request and therefore sends no
`Origin` header, so the APISIX gateway rejects it. `fetch()` always sends
`Origin` for cross-site requests, so it passes.

## Fix applied — `client/src/components/Map.tsx`

`loadMapScript()` rewritten to:
1. `fetch()` the bundle from the proxy (sends `Origin`, gets 200).
2. Wrap the returned code in a `Blob` and execute it from a same-origin Blob URL.
3. `URL.revokeObjectURL()` in a `finally` block.
4. Assert `window.google?.maps` is populated afterwards; throw otherwise.
5. Cache the in-flight promise (shared across MapView mounts); reset it to `null`
   on failure so a later mount can retry.

## Verified result on `/connect`

Live DOM now contains real Google Maps chrome: `Map`/`Satellite` type switcher,
zoom in/out, fullscreen, Street View Pegman, keyboard-shortcuts button, "Terms",
`maps.googleapis.com/maps/vt?...` raster tiles, plus the geocoded
AdvancedMarkerElement with an open InfoWindow reading
"Graceway Baptist Church / 2791 Driscoll Rd, Fremont, CA 94539".

Note: `webdev_take_screenshot` does not render the map canvas (it captures before
tiles paint), so verify via `browser_navigate` DOM inspection instead.

## Connect.tsx implementation
- `CHURCH_COORDS = { lat: 37.5223, lng: -121.9188 }` as geocoding fallback.
- `handleMapReady` runs `google.maps.Geocoder().geocode({ address })`, recenters,
  drops an `AdvancedMarkerElement`, and opens a styled `InfoWindow`.
- Address card overlays the map, "Get Directions" links to
  `https://maps.google.com/?q=2791+Driscoll+Rd,+Fremont,+CA+94539`.

## Deployed domains
- `graceway-baptist.manus.space`
- `gracewaybc-skghmy3b.manus.space`
