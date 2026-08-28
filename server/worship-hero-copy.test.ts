import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const worshipSource = readFileSync(resolve(process.cwd(), "client/src/pages/Worship.tsx"), "utf8");

describe("worship hero copy", () => {
  it("uses the requested Korean Sunday worship-video library description", () => {
    expect(worshipSource).toContain("매주일 올려드리는 주일예배 찬양영상 라이브러리");
    expect(worshipSource).toContain('description={lang === "ko"');
  });
});
