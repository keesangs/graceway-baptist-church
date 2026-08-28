import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const aboutSource = readFileSync(resolve(process.cwd(), "client/src/pages/About.tsx"), "utf8");
const languageSource = readFileSync(resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"), "utf8");

describe("About leadership copy", () => {
  it("uses the requested Korean leadership section labels and MyeongJe evangelist title", () => {
    expect(languageSource).toContain('"about.leadership": { en: "Our Team", ko: "섬기시는 분들" }');
    expect(languageSource).toContain('"about.leadershipTitle": { en: "Leadership", ko: "교회 리더십" }');
    expect(aboutSource).toContain('nameKo: "조명제 전도사"');
  });
});
