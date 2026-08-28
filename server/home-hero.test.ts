import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("Home hero brand mark", () => {
  it("uses a prominent, left-centered desktop-only official Graceway mark behind readable content", () => {
    expect(homeSource).toContain("ease-out");
    expect(homeSource).toContain("lg:block");
    expect(homeSource).toContain('width: "clamp(16rem, 24vw, 28rem)"');
    expect(homeSource).toContain('height: "clamp(18rem, 27vw, 31rem)"');
    expect(homeSource).toContain("right-[35%]");
    expect(homeSource).toContain("xl:right-[44%]");
    expect(homeSource).toContain("opacity: heroVisible ? 0.13 : 0");
    expect(homeSource).toContain("absolute z-0 right-[35%]");
    expect(homeSource).toContain('className="relative z-10 container pt-24 pb-32"');
  });

  it("preserves the requested Korean vision line break in the editorial vision panel", () => {
    const translations = readFileSync(resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"), "utf8");

    expect(homeSource).toContain('className="mt-5 max-w-md whitespace-pre-line"');
    expect(translations).toContain('ko: "다시 말씀으로,\\n다시 세상으로..."');
  });
});
