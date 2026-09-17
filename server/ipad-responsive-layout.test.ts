import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const navbarSource = readFileSync(resolve(process.cwd(), "client/src/components/Navbar.tsx"), "utf8");
const eventsSource = readFileSync(resolve(process.cwd(), "client/src/pages/Events.tsx"), "utf8");

describe("iPad responsive layout", () => {
  it("uses an intentionally spacious compact navigation before the desktop link row can become crowded", () => {
    expect(navbarSource).toContain("xl:flex");
    expect(navbarSource).toContain("xl:hidden");
    expect(navbarSource).toContain('aria-label="Compact navigation"');
    expect(navbarSource).toContain("min-h-11");
    expect(navbarSource).toContain("whitespace-nowrap");
  });

  it("keeps monthly-calendar guidance in its own region before the date grid", () => {
    const guidance = 'aria-label={lang === "ko" ? "월간 일정 안내" : "Monthly calendar guidance"}';
    expect(eventsSource).toContain(guidance);
    expect(eventsSource.indexOf(guidance)).toBeLessThan(eventsSource.indexOf("<Calendar\n"));
    expect(eventsSource).toContain("rounded-lg border border-[#DCE4E7] bg-[#F4F6F7]");
  });
});
