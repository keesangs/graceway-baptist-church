import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Worship archive thumbnail refresh", () => {
  it("uses synced YouTube metadata for pre-existing worship cards and versions refreshed images", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/Worship.tsx"),
      "utf8",
    );

    expect(source).toContain("const syncedByVideoId = new Map(");
    expect(source).toContain("const refreshedLegacyWorships = legacyWorships.map");
    expect(source).toContain("thumbnailUrl: `${synced.thumbnailUrl}${separator}cb=${thumbnailVersion}`");
    expect(source).toContain("return [...newSyncedWorships, ...refreshedLegacyWorships].sort(");
  });
});
