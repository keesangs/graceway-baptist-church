import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const worshipSource = readFileSync(resolve(process.cwd(), "client/src/pages/Worship.tsx"), "utf8");
const shareButtonSource = readFileSync(resolve(process.cwd(), "client/src/components/VideoShareButton.tsx"), "utf8");

describe("worship video sharing", () => {
  it("uses the shared video component on the featured, archive, and player views", () => {
    expect(worshipSource).toContain('import { VideoShareButton } from "@/components/VideoShareButton"');
    expect(worshipSource.match(/contentType="worship"/g)).toHaveLength(3);
    expect(worshipSource).toContain("const playingWorship = worships.find");
  });

  it("labels worship sharing independently from sermon sharing", () => {
    expect(shareButtonSource).toContain('contentType?: "sermon" | "worship"');
    expect(shareButtonSource).toContain('"찬양 영상"');
    expect(shareButtonSource).toContain('"worship video"');
  });
});
