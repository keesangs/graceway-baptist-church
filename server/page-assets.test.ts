import { describe, expect, it } from "vitest";
import { abstractVisualKinds } from "@/components/BrandAbstractVisual";
import { brandLogoSources } from "@/components/BrandLogo";

describe("public page brand assets", () => {
  it("uses CSS-only abstract visuals for refreshed public editorial panels", () => {
    expect(abstractVisualKinds).toEqual(["path", "word", "community", "sending", "youth", "welcome"]);
  });

  it("uses the supplied official lockup in both light and reverse variants", () => {
    expect(brandLogoSources).toEqual({
      "on-light": "/manus-storage/graceway-logo-light_4da05d65.png",
      "on-dark": "/manus-storage/graceway-logo-dark_65272897.png",
    });
  });
});
