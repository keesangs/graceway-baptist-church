import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { brandLogoIntrinsicSizes, brandLogoSources } from "@/components/BrandLogo";

const assetManifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "docs/navbar-logo-asset-manifest.json"), "utf8"),
) as {
  runtimePath: string;
  format: string;
  intrinsicSize: { width: number; height: number };
  aspectRatio: number;
  background: string;
};

describe("navbar reverse lockup contract", () => {
  it("uses the finalized transparent high-resolution PNG at the declared wide lockup ratio", () => {
    expect(assetManifest.runtimePath).toBe(brandLogoSources["on-dark"]);
    expect(assetManifest.format).toBe("PNG RGBA");
    expect(assetManifest.background).toBe("transparent");
    expect(assetManifest.intrinsicSize).toEqual(brandLogoIntrinsicSizes["on-dark"]);
    expect(assetManifest.aspectRatio).toBeGreaterThan(3.8);
  });
});
