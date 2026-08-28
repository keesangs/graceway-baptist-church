import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("Home hero brand mark", () => {
  it("uses a restrained desktop-only official Graceway mark without constraining tablet content", () => {
    expect(homeSource).toContain("ease-out");
    expect(homeSource).toContain("lg:block");
    expect(homeSource).toContain('width: "clamp(12rem, 16vw, 20rem)"');
    expect(homeSource).toContain('height: "clamp(14rem, 19vw, 23rem)"');
    expect(homeSource).toContain("right-[24%]");
    expect(homeSource).toContain("xl:right-[32%]");
    expect(homeSource).toContain("opacity: heroVisible ? 0.13 : 0");
    expect(homeSource).toContain("absolute z-0 right-[24%]");
    expect(homeSource).toContain('className="relative z-10 container pt-24 pb-32"');
  });

  it("preserves the requested Korean vision line break in the editorial vision panel", () => {
    const translations = readFileSync(resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"), "utf8");

    expect(homeSource).toContain('className="mt-5 max-w-md whitespace-pre-line"');
    expect(translations).toContain('ko: "다시 말씀으로,\\n다시 세상으로..."');
  });
});
