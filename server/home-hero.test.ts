import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("Home hero brand mark", () => {
  it("uses a quiet, mid-scale desktop-only official Graceway mark without constraining tablet content", () => {
    expect(homeSource).toContain("ease-out lg:block");
    expect(homeSource).toContain('width: "clamp(15rem, 21vw, 25rem)"');
    expect(homeSource).toContain('height: "clamp(17rem, 24vw, 28rem)"');
    expect(homeSource).toContain("right-[11%]");
    expect(homeSource).toContain("opacity: heroVisible ? 0.16 : 0");
  });

  it("preserves the requested Korean vision line break in the editorial vision panel", () => {
    const translations = readFileSync(resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"), "utf8");

    expect(homeSource).toContain('className="mt-5 max-w-md whitespace-pre-line"');
    expect(translations).toContain('ko: "다시 말씀으로,\\n다시 세상으로..."');
  });
});
