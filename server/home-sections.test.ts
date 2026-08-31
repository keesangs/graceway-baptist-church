import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("Home editorial sections", () => {
  it("links the story detail CTA to the About page", () => {
    expect(homeSource).toContain('href="/about"');
    expect(homeSource).toContain('lang === "ko" ? "자세히 보기" : "Learn More"');
  });

  it("places the worship guide before recent sermons with the real schedule and location", () => {
    const worshipGuidePosition = homeSource.indexOf('id="services"');
    const recentSermonsPosition = homeSource.indexOf("RECENT SERMONS");

    expect(worshipGuidePosition).toBeGreaterThan(-1);
    expect(recentSermonsPosition).toBeGreaterThan(worshipGuidePosition);
    ["1:30 PM", "8:00 PM", "2791 Driscoll Rd, Fremont, CA 94539"].forEach((value) => {
      expect(homeSource).toContain(value);
    });
  });

  it("uses the shared smooth hover scale for Home image panels", () => {
    expect(homeSource.match(/group-hover:scale-\[1\.045\]/g)?.length).toBeGreaterThanOrEqual(3);
    expect(homeSource).toContain("motion-reduce:transition-none");
  });

  it("uses the shared canonical sermon source so Home recent cards show distinct service dates", () => {
    expect(homeSource).toContain("trpc.youtube.list.useQuery(HOME_SERMON_LIST_INPUT)");
    expect(homeSource).toContain("sermonCards.slice(1, 4)");
    expect(homeSource).toContain("getCanonicalSermonCards(legacySermons, syncedSermonsQuery.data ?? [])");
    expect(homeSource).toContain("getSermonMetadataLines");
    expect(homeSource).toContain('titleKo: "성령으로 채우시다"');
    expect(homeSource).toContain('titleKo: "성령이 임하시다"');
    expect(homeSource).toContain('scripture: "사도행전 2:1–13"');
    expect(homeSource).toContain('titleKo: "하나님을 따라간다는 것"');
  });

  it("uses the public upcoming-events query rather than fixed calendar dates and links to the full calendar", () => {
    expect(homeSource).toContain("trpc.events.upcoming.useQuery()");
    expect(homeSource).toContain('href="/events"');
    expect(homeSource).not.toContain('titleEn: "Sunday Worship Service"');
  });

  it("shows each upcoming event location beside its scheduled time when a location is provided", () => {
    expect(homeSource).toContain("venueKo: string | null");
    expect(homeSource).toContain("venueEn: string | null");
    expect(homeSource).toContain("const venue = lang === \"en\" && event.venueEn ? event.venueEn : event.venueKo;");
    expect(homeSource).toContain("venue ?");
    expect(homeSource).toContain("<MapPin size={10} />");
    expect(homeSource).toContain("{venue}");
  });
});
