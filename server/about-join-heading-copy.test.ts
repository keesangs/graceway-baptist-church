import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const languageSource = readFileSync(resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"), "utf8");

describe("About join heading copy", () => {
  it("stores the Korean join invitation as the requested two-line phrase", () => {
    expect(languageSource).toContain('ko: "매 주일, 여러분을 위한 자리가\\n준비되어 있습니다."');
  });
});
