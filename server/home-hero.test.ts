import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("Home hero brand mark", () => {
  it("uses a larger desktop-only official Graceway mark without constraining tablet content", () => {
    expect(homeSource).toContain("ease-out lg:block");
    expect(homeSource).toContain('width: "clamp(19rem, 30vw, 34rem)"');
    expect(homeSource).toContain('height: "clamp(22rem, 34vw, 38rem)"');
    expect(homeSource).toContain("right-[4%]");
  });
});
