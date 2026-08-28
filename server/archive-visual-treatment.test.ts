import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sermonsSource = readFileSync(resolve(process.cwd(), "client/src/pages/Sermons.tsx"), "utf8");
const worshipSource = readFileSync(resolve(process.cwd(), "client/src/pages/Worship.tsx"), "utf8");

describe("Sermon and worship archive visual treatment", () => {
  it("keeps the authentic YouTube imagery while applying the Graceway slate-and-gold visual frame", () => {
    [sermonsSource, worshipSource].forEach((source) => {
      expect(source).toContain("ytThumb(");
      expect(source).toContain("border-[#D8C49E]");
      expect(source).toContain("rgba(86,112,138");
    });
  });
});
