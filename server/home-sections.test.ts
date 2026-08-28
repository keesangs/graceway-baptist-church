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
});
