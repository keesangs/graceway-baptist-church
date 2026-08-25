import { describe, expect, it } from "vitest";
import { allPageImageAssets } from "@/lib/pageAssets";

describe("public page image assets", () => {
  it("uses project-managed manuscript storage paths for every restored editorial image", () => {
    expect(allPageImageAssets).toHaveLength(6);
    expect(allPageImageAssets.every((asset) => asset.startsWith("/manus-storage/"))).toBe(true);
    expect(new Set(allPageImageAssets).size).toBe(6);
  });

  it("does not reintroduce the retired missing image keys", () => {
    const retiredAssets = [
      "/manus-storage/graceway_story_abstract_d586e6ae.jpg",
      "/manus-storage/graceway_welcome_home_abstract_b58c325d.jpg",
      "/manus-storage/graceway_about_abstract_45d6795b.jpg",
      "/manus-storage/graceway_ministry_word_abstract_13bb7682.jpg",
      "/manus-storage/graceway_ministry_community_abstract_625e9dfc.jpg",
      "/manus-storage/graceway_ministry_mission_abstract_d616e786.jpg",
      "/manus-storage/graceway_youth_abstract_3b6ac36a.jpg",
    ];

    retiredAssets.forEach((asset) => {
      expect(allPageImageAssets).not.toContain(asset);
    });
  });
});
