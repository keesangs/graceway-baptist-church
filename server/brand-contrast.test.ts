import { describe, expect, it } from "vitest";

function luminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Graceway brand contrast", () => {
  it("keeps primary and secondary reading text above WCAG AA normal-text contrast", () => {
    expect(contrast("#163B59", "#FCFAF6")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#4F697E", "#FCFAF6")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#44515C", "#FCFAF6")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps reverse navigation text and its gold focus treatment legible", () => {
    expect(contrast("#FFFFFF", "#163B59")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#D9B87A", "#163B59")).toBeGreaterThanOrEqual(3);
  });

  it("keeps CTA and hover states readable against Graceway's muted gold surfaces", () => {
    expect(contrast("#0B2C43", "#B9955E")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#0B2C43", "#C8A977")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#0B2C43", "#C9973E")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the actual input focus ring distinct from ivory input surfaces", () => {
    expect(contrast("#607A91", "#FFFFFF")).toBeGreaterThanOrEqual(3);
  });

  it("keeps the shared dual-ring keyboard focus indicator visible on light and navy surfaces", () => {
    expect(contrast("#0B2C43", "#FCFAF6")).toBeGreaterThanOrEqual(3);
    expect(contrast("#D9B87A", "#163B59")).toBeGreaterThanOrEqual(3);
  });
});
