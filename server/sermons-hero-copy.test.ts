import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const languageSource = readFileSync(resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"), "utf8");
const sermonsSource = readFileSync(resolve(process.cwd(), "client/src/pages/Sermons.tsx"), "utf8");

describe("sermons hero copy", () => {
  it("uses the requested Korean Sunday-sermon library description through the shared hero", () => {
    expect(languageSource).toContain("매주일 선포되는 주일예배 설교영상과 기타 말씀영상 라이브러리");
    expect(sermonsSource).toContain('description={t("sermons.subtitle")}');
  });
});
