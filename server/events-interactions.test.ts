import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createGoogleCalendarUrl } from "../client/src/lib/googleCalendar";

const eventsSource = readFileSync(resolve(process.cwd(), "client/src/pages/Events.tsx"), "utf8");
const routersSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

describe("event card interactions", () => {
  it("builds a Google Calendar template URL with timed event details and church timezone", () => {
    const url = new URL(createGoogleCalendarUrl({
      title: "Sunday Worship",
      start: new Date("2026-08-09T20:30:00.000Z"),
      end: new Date("2026-08-09T22:00:00.000Z"),
      allDay: false,
      location: "2791 Driscoll Rd, Fremont, CA 94539",
      description: "Welcome to worship.",
    }));

    expect(url.origin).toBe("https://calendar.google.com");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20260809T203000Z/20260809T220000Z");
    expect(url.searchParams.get("ctz")).toBe("America/Los_Angeles");
    expect(url.searchParams.get("location")).toContain("Driscoll");
  });

  it("uses exclusive all-day dates and defaults an untimed end to the next day", () => {
    const withEnd = new URL(createGoogleCalendarUrl({
      title: "Church retreat",
      start: new Date("2026-08-22T07:00:00.000Z"),
      end: new Date("2026-08-23T07:00:00.000Z"),
      allDay: true,
    }));
    const withoutEnd = new URL(createGoogleCalendarUrl({
      title: "Prayer meeting",
      start: new Date("2026-08-13T03:00:00.000Z"),
      allDay: false,
    }));

    expect(withEnd.searchParams.get("dates")).toBe("20260822/20260823");
    expect(withoutEnd.searchParams.get("dates")).toBe("20260813T030000Z/20260813T040000Z");
  });

  it("provides type filters, accessible toggle state, restrained motion, and a safe external calendar link", () => {
    expect(eventsSource).toContain('aria-pressed={eventFilter === option.value}');
    expect(eventsSource).toContain("filteredOccurrences");
    expect(eventsSource).toContain("filteredUpcoming");
    expect(eventsSource).toContain("hover:-translate-y-1");
    expect(eventsSource).toContain("motion-reduce:transform-none");
    expect(eventsSource).toContain('target="_blank"');
    expect(eventsSource).toContain('rel="noreferrer"');
    expect(eventsSource).toContain("Google Calendar에 추가");
  });

  it("renders a bilingual featured special-event banner with event-detail and personal-calendar actions", () => {
    expect(routersSource).toContain("featuredSpecial: publicProcedure");
    expect(eventsSource).toContain("featuredSpecialQuery");
    expect(eventsSource).toContain("추천 행사");
    expect(eventsSource).toContain("Featured event");
    expect(eventsSource).toContain("showFeaturedDate");
    expect(eventsSource).toContain("내 캘린더에 추가");
  });
});
