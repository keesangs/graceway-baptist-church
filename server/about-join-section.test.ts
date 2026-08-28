import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const aboutSource = readFileSync(resolve(process.cwd(), "client/src/pages/About.tsx"), "utf8");

describe("About join section", () => {
  it("keeps the join heading, description, and visit CTA centered", () => {
    expect(aboutSource).toContain('className="py-20 bg-white text-center"');
    expect(aboutSource).toContain('className="container max-w-xl mx-auto"');
    expect(aboutSource).toContain('href="/connect"');
    expect(aboutSource).toContain('className="inline-flex items-center gap-2 px-8 py-3.5');
  });
});
