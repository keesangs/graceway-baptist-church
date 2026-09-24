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

  it("shows MyeongJe Cho's requested bilingual education and ministry profile", () => {
    expect(aboutSource).toContain('nameEn: "Pastor MyeongJe Cho"');
    expect(aboutSource).toContain(
      'educationKo: "농학 박사, University of Illinois at Urbana-Champaign | 신학 석사 과정, Midwestern Seminary"'
    );
    expect(aboutSource).toContain(
      'educationEn: "Ph.D. in Agricultural Sciences, University of Illinois at Urbana-Champaign | Master’s Studies in Theology, Midwestern Seminary"'
    );
    expect(aboutSource).toContain(
      'ministryKo: "전도사, Gracepoint Fellowship Church, Berkeley | Bridgeway Baptist Church, Palo Alto | Graceway Baptist Church, Fremont"'
    );
    expect(aboutSource).toContain(
      'ministryEn: "Pastoral Staff, Gracepoint Fellowship Church, Berkeley | Bridgeway Baptist Church, Palo Alto | Graceway Baptist Church, Fremont"'
    );
    expect(aboutSource).toContain('(s.bioEn || s.educationEn || s.ministryEn)');
  });
});
