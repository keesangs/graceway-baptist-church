import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const footerSource = readFileSync(resolve(process.cwd(), "client/src/components/Footer.tsx"), "utf8");

describe("footer social media links", () => {
  it("uses the verified official social profiles rather than placeholder destinations", () => {
    expect(footerSource).toContain("https://www.facebook.com/people/Graceway-Baptist-Church/61594452553986/");
    expect(footerSource).toContain("https://www.instagram.com/gracewaybaptistchurchfremont");
    expect(footerSource).toContain("https://www.youtube.com/@Graceway-Baptist");
    expect(footerSource).not.toContain('{ icon: Facebook, label: "Facebook", href: "#" }');
  });

  it("opens external social profiles with accessible and safe link attributes", () => {
    expect(footerSource).toContain('target="_blank"');
    expect(footerSource).toContain('rel="noopener noreferrer"');
    expect(footerSource).toContain('aria-label={`${label} (opens in a new tab)`}');
  });
});
