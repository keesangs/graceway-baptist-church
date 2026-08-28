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

  it("uses 380px and 200px desktop grid tracks without forcing fixed widths on smaller screens", () => {
    expect(footerSource).toContain("lg:grid-cols-[380px_200px_minmax(0,1fr)_minmax(0,1fr)]");
    expect(footerSource).toContain("grid-cols-1 gap-10 md:grid-cols-2");
    expect(footerSource).not.toContain("style={{width:");
  });
});
