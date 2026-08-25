/**
 * Stable, project-managed image paths used by the public-facing editorial pages.
 * Keep these values in one place so a removed asset can be replaced consistently.
 */
export const pageImageAssets = {
  // About editorial panel — abstract path and light.
  aboutPath: "/manus-storage/graceway-about-path-abstract_e09b96e0.jpg",
  // Home editorial panels — existing verified church media.
  story: "/manus-storage/hero_bg_navy_a8d916a9.jpg",
  welcome: "/manus-storage/community_worship_a9637ac3.jpg",
  // Ministry editorial panels — each assigned a distinct verified asset.
  ministryWord: "/manus-storage/sermon_stage_0620f4b7.jpg",
  ministryCommunity: "/manus-storage/hero_bg_67c2aa9c.jpg",
  ministryYouth: "/manus-storage/hero_river_poster_53c7cd5e.jpg",
} as const;

export const allPageImageAssets = Object.values(pageImageAssets);
