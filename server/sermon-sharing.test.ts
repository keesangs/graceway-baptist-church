import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(resolve(process.cwd(), "client/src/components/VideoShareButton.tsx"), "utf8");
const sermonsSource = readFileSync(resolve(process.cwd(), "client/src/pages/Sermons.tsx"), "utf8");
const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("sermon video sharing", () => {
  it("uses the native share sheet with a clipboard fallback and accessible status", () => {
    expect(componentSource).toContain("navigator.share");
    expect(componentSource).toContain("navigator.clipboard?.writeText");
    expect(componentSource).toContain('aria-live="polite"');
    expect(componentSource).toContain("https://www.youtube.com/watch?v=");
  });

  it("offers sharing from the featured sermon, archive cards, and video player", () => {
    expect(sermonsSource.match(/<VideoShareButton/g)?.length).toBeGreaterThanOrEqual(3);
    expect(sermonsSource).toContain("const playingSermon");
    expect(sermonsSource).toContain("article key={s.videoId}");
  });

  it("keeps the same share action available from the Home recent-sermon feature and rows", () => {
    expect(homeSource).toContain('import { VideoShareButton } from "@/components/VideoShareButton"');
    expect(homeSource.match(/<VideoShareButton/g)?.length).toBeGreaterThanOrEqual(2);
    expect(homeSource).toContain("sermonCards.slice(1, 4)");
  });
});
