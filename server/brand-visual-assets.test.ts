import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const assetsSource = readFileSync(resolve(process.cwd(), "client/src/lib/brandVisualAssets.ts"), "utf8");
const aboutSource = readFileSync(resolve(process.cwd(), "client/src/pages/About.tsx"), "utf8");
const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("Refreshed Graceway visual assets", () => {
  it("provides a hosted refreshed visual for each of the primary public page contexts", () => {
    [
      "graceway-renewal-style-reference_dcc4d541.jpg",
      "graceway-home-ribbon-2026_8b537440.jpg",
      "graceway-about-marble-2026_83654443.jpeg",
      "graceway-about-story-riverlight-2026_b7fceaa5.png",
      "graceway-sermons-current-2026_29c55360.jpg",
      "graceway-worship-current-2026_95ba9b2b.jpeg",
    ].forEach((asset) => expect(assetsSource).toContain(asset));
  });

  it("assigns dedicated hosted visuals for the Word, community, campus, youth, and sending ministries", () => {
    ["word", "community", "campus", "sending", "youth"].forEach((kind) => expect(assetsSource).toContain(`${kind}: \"/manus-storage/graceway-ministry-`));
  });

  it("uses the cross-free river-light image without the path marker in the About story panel", () => {
    expect(aboutSource).toContain("imageSrc={brandVisualAssets.aboutStory}");
    expect(aboutSource).toContain("showPathMotif={false}");
  });

  it("shares the river-light visual and smooth hover zoom across the Home and About story panels", () => {
    [homeSource, aboutSource].forEach((source) => {
      expect(source).toContain("imageSrc={brandVisualAssets.aboutStory}");
      expect(source).toContain("group-hover:scale-[1.045]");
      expect(source).toContain("motion-reduce:transition-none");
    });
  });
});
