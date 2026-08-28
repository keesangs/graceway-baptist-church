import { describe, expect, it } from "vitest";
import { abstractVisualKinds } from "@/components/BrandAbstractVisual";
import { brandLogoIntrinsicSizes, brandLogoSources } from "@/components/BrandLogo";

describe("public page brand assets", () => {
  it("uses CSS-only abstract visuals for refreshed public editorial panels", () => {
    expect(abstractVisualKinds).toEqual(["path", "word", "community", "campus", "sending", "youth", "welcome"]);
  });

  it("uses the supplied official light lockup and the finalized high-resolution reverse lockup", () => {
    expect(brandLogoSources).toEqual({
      "on-light": "/manus-storage/graceway-logo-light_4da05d65.png",
      "on-dark": "/manus-storage/graceway-logo-dark-approved_ab158297.png",
    });
    expect(brandLogoSources["on-dark"]).toMatch(/graceway-logo-dark-approved_[a-f0-9]{8}\.png$/);
    expect(brandLogoIntrinsicSizes["on-dark"]).toEqual({ width: 2012, height: 522 });
    expect(brandLogoIntrinsicSizes["on-dark"].width / brandLogoIntrinsicSizes["on-dark"].height).toBeGreaterThan(3.8);
  });
});
