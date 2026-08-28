import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type BrandAsset = {
  id: string;
  storagePath: string;
  byteSize: number;
  sha256: string;
  usedBy: string[];
};

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "docs/brand-assets-manifest.json"), "utf8"),
) as { manifestVersion: number; assets: BrandAsset[] };

describe("Git-tracked brand asset manifest", () => {
  it("records every refreshed public-page visual with an immutable managed-storage path", () => {
    expect(manifest.manifestVersion).toBe(1);
    expect(manifest.assets).toHaveLength(10);
    manifest.assets.forEach((asset) => {
      expect(asset.storagePath).toMatch(/^\/manus-storage\/.+/);
      expect(asset.byteSize).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.usedBy.length).toBeGreaterThan(0);
    });
  });
});
