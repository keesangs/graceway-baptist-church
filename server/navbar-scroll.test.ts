import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const navbarSource = readFileSync(resolve(process.cwd(), "client/src/components/Navbar.tsx"), "utf8");

describe("Sticky shrinking navigation", () => {
  it("keeps the header fixed and changes its height, logo scale, and desktop spacing after scrolling", () => {
    expect(navbarSource).toContain("fixed left-0 right-0 top-0 z-50");
    expect(navbarSource).toContain("setScrolled(window.scrollY > 60)");
    expect(navbarSource).toContain('scrolled ? "h-[3.75rem] md:h-[4.25rem]" : "h-[4.5rem] md:h-[5.25rem]"');
    expect(navbarSource).toContain('scrolled ? "w-[8.8rem] sm:w-[11rem]" : "w-[10.6rem] sm:w-[13.5rem]"');
    expect(navbarSource).toContain('scrolled ? "gap-4 lg:gap-5" : "gap-5 lg:gap-6"');
  });
});
