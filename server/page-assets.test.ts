import { describe, expect, it } from "vitest";
import { abstractVisualKinds } from "@/components/BrandAbstractVisual";
import { pageImageAssets } from "@/lib/pageAssets";

describe("public page image assets", () => {
  it("uses CSS-only abstract visuals for the refreshed Home, About, and Ministries editorial panels", () => {
    expect(pageImageAssets).toEqual({});
    expect(abstractVisualKinds).toEqual(["path", "word", "community", "sending", "youth", "welcome"]);
  });

  it("does not reintroduce the retired photographic and missing editorial image keys", () => {
    const retiredAssets = [
      "/manus-storage/graceway_story_abstract_d586e6ae.jpg",
      "/manus-storage/graceway_welcome_home_abstract_b58c325d.jpg",
      "/manus-storage/graceway_about_abstract_45d6795b.jpg",
      "/manus-storage/graceway_ministry_word_abstract_13bb7682.jpg",
      "/manus-storage/graceway_ministry_community_abstract_625e9dfc.jpg",
      "/manus-storage/graceway_ministry_mission_abstract_d616e786.jpg",
      "/manus-storage/graceway_youth_abstract_3b6ac36a.jpg",
      "/manus-storage/community_worship_a9637ac3.jpg",
      "/manus-storage/sermon_stage_0620f4b7.jpg",
      "/manus-storage/hero_bg_67c2aa9c.jpg",
      "/manus-storage/hero_river_poster_53c7cd5e.jpg",
    ];

    retiredAssets.forEach((asset) => {
      expect(Object.values(pageImageAssets)).not.toContain(asset);
    });
  });
});
