import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("About join invitation copy", () => {
  it("uses the requested Korean invitation under the join section", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"),
      "utf8",
    );

    expect(source).toContain(
      'ko: "은혜의 자리로 초대합니다 — 완벽한 믿음은 필요하지 않습니다."',
    );
  });
});
