import { describe, expect, it } from "vitest";
import { abstractVisualKinds } from "@/components/BrandAbstractVisual";
import { brandLogoIntrinsicSizes, brandLogoSources } from "@/components/BrandLogo";

describe("public page brand assets", () => {
  it("uses CSS-only abstract visuals for refreshed public editorial panels", () => {
    expect(abstractVisualKinds).toEqual(["path", "word", "community", "campus", "sending", "youth", "welcome"]);
  });

  it("uses the current supplied light and dark official lockups", () => {
    expect(brandLogoSources).toEqual({
      "on-light": "/manus-storage/graceway-logo-light-updated_e386b8f1.png",
      "on-dark": "/manus-storage/graceway-logo-dark-updated_bda9aced.png",
    });
    expect(brandLogoSources["on-light"]).toMatch(/graceway-logo-light-updated_[a-f0-9]{8}\.png$/);
    expect(brandLogoSources["on-dark"]).toMatch(/graceway-logo-dark-updated_[a-f0-9]{8}\.png$/);
    expect(brandLogoIntrinsicSizes["on-light"]).toEqual({ width: 3086, height: 763 });
    expect(brandLogoIntrinsicSizes["on-dark"]).toEqual({ width: 3086, height: 763 });
    expect(brandLogoIntrinsicSizes["on-dark"].width / brandLogoIntrinsicSizes["on-dark"].height).toBeGreaterThan(4);
  });
});
