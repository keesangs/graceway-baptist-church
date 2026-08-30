import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

describe("OAuth public policy pages", () => {
  it("registers public privacy and terms routes", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('path="/privacy"');
    expect(app).toContain('path="/terms"');
  });

  it("discloses the Google Photos selected-import purpose and consent requirements", () => {
    const privacy = read("client/src/pages/PrivacyPolicy.tsx");
    const terms = read("client/src/pages/TermsOfService.tsx");
    expect(privacy).toContain("Google Photos");
    expect(privacy).toContain("관리자가 명시적으로 선택한 사진");
    expect(terms).toContain("필요한 동의");
    expect(terms).toContain("Google Photos 연결");
  });

  it("makes both pages discoverable from the shared footer", () => {
    const footer = read("client/src/components/Footer.tsx");
    expect(footer).toContain('href="/privacy"');
    expect(footer).toContain('href="/terms"');
  });
});
