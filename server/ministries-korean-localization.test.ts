import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Ministries Korean localization", () => {
  it("renders local Korean copy through the shared language context", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/Ministries.tsx"),
      "utf8",
    );

    expect(source).toContain('import { useLang } from "@/contexts/LanguageContext";');
    expect(source).toContain('eyebrow: "함께하는 사역"');
    expect(source).toContain('heroTitle: "사역"');
    expect(source).toContain('title: "대학 캠퍼스 사역"');
    expect(source).toContain('title: "청소년 사역"');
    expect(source).toContain('moreWays: "더 함께할 수 있는 사역"');
  });
});
