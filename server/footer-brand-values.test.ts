import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const footerSource = readFileSync(resolve(process.cwd(), "client/src/components/Footer.tsx"), "utf8");
const languageSource = readFileSync(resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"), "utf8");

describe("footer brand values", () => {
  it("uses the requested Korean brand-value tagline through a dedicated translation key", () => {
    expect(languageSource).toContain('ko: "은혜 | 믿음 | 말씀 | 사랑 공동체"');
    expect(footerSource).toContain('t("footer.brandValues")');
  });
});
