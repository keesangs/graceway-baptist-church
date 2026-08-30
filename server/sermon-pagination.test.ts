import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sermonsSource = () =>
  readFileSync(resolve(process.cwd(), "client/src/pages/Sermons.tsx"), "utf8");

describe("sermon archive pagination", () => {
  it("limits each archive page to six sermon cards", () => {
    const source = sermonsSource();
    expect(source).toContain("const SERMONS_PER_PAGE = 6");
    expect(source).toContain("const paginatedSermons = filtered.slice(pageStart, pageStart + SERMONS_PER_PAGE)");
    expect(source).toContain("{paginatedSermons.map((s) => (");
  });

  it("returns to the first page whenever search or series filtering changes", () => {
    const source = sermonsSource();
    expect(source).toContain("setSearch(e.target.value);");
    expect(source).toContain("setActiveSeries(s);");
    expect(source).toContain("setCurrentPage(1);");
  });

  it("provides labelled previous and next controls with boundary protection", () => {
    const source = sermonsSource();
    expect(source).toContain('aria-label={lang === "ko" ? "설교 목록 페이지 탐색"');
    expect(source).toContain("disabled={visiblePage === 1}");
    expect(source).toContain("disabled={visiblePage === totalPages}");
  });
});
