# Navigation Logo Asset Record

## Final deployed assets

The navigation, footer, and related branded surfaces use the current supplied bilingual Graceway lockups:

- Dark surfaces: `/manus-storage/graceway-logo-dark-updated_bda9aced.png`
- Light surfaces: `/manus-storage/graceway-logo-light-updated_e386b8f1.png`

The dark asset is the supplied transparent lockup with white lettering. The light asset is the complementary navy-lettered variant derived from the same supplied transparent master so the identity remains consistent on light backgrounds.

| Property | Final value |
| --- | --- |
| Native size | 3,086 × 763 px |
| Proportion | 4.04:1 wide lockup |
| Background | Transparent RGBA |
| Artwork | Graceway symbol, English wordmark, and Korean church name |
| Runtime treatment | `object-contain`, explicit intrinsic dimensions, high-priority decode, GPU-backed 1.2% hover scale |

## Superseded candidates

The earlier 433 × 113 px raster had visible color fringing. A simple 4× resample propagated those defects, while an early vector candidate did not sufficiently match the supplied bilingual lockup. Neither candidate is used at runtime.
