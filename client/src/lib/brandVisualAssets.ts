import type { BrandAbstractVisualKind } from "@/components/BrandAbstractVisual";

/** Final hosted image set used by the refreshed Graceway public pages. */
export const brandVisualAssets = {
  homeHero: "/manus-storage/graceway-renewal-style-reference_dcc4d541.jpg",
  homeStory: "/manus-storage/graceway-home-ribbon-2026_8b537440.jpg",
  aboutPath: "/manus-storage/graceway-about-marble-2026_83654443.jpeg",
  aboutStory: "/manus-storage/graceway-about-story-hero-variation-2026_831d3159.png",
  sermonsCover: "/manus-storage/graceway-sermons-current-2026_29c55360.jpg",
  worshipCover: "/manus-storage/graceway-worship-current-2026_95ba9b2b.jpeg",
  ministry: {
    path: "/manus-storage/graceway-about-marble-2026_83654443.jpeg",
    word: "/manus-storage/graceway-ministry-word-2026_c63669a4.jpg",
    community: "/manus-storage/graceway-ministry-community-2026_f8cf29df.jpg",
    campus: "/manus-storage/graceway-ministry-campus-2026_d5a584cf.jpg",
    sending: "/manus-storage/graceway-ministry-sending-2026_46e8d75b.jpg",
    youth: "/manus-storage/graceway-ministry-youth-2026_2f2ea55f.jpg",
    welcome: "/manus-storage/graceway-home-ribbon-2026_8b537440.jpg",
  } satisfies Record<BrandAbstractVisualKind, string>,
} as const;
