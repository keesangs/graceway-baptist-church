import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getResponsiveSermonsPerPage } from "../client/src/pages/Sermons";

const sermonsSource = () =>
  readFileSync(resolve(process.cwd(), "client/src/pages/Sermons.tsx"), "utf8");

describe("sermon archive pagination", () => {
  it("keeps archive cards within two rows at each grid breakpoint", () => {
    const source = sermonsSource();
    expect(getResponsiveSermonsPerPage(1440)).toBe(8);
    expect(getResponsiveSermonsPerPage(1100)).toBe(6);
    expect(getResponsiveSermonsPerPage(800)).toBe(4);
    expect(getResponsiveSermonsPerPage(390)).toBe(2);
    expect(source).toContain("const paginatedSermons = filtered.slice(pageStart, pageStart + sermonsPerPage)");
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
    expect(source).toContain("disabled={visiblePage === 1 || isArchiveTransitioning}");
    expect(source).toContain("disabled={visiblePage === totalPages || isArchiveTransitioning}");
  });

  it("fades the archive briefly before changing pages and respects reduced motion", () => {
    const source = sermonsSource();
    expect(source).toContain("const ARCHIVE_FADE_DURATION_MS = 160");
    expect(source).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches');
    expect(source).toContain("setIsArchiveTransitioning(true);");
    expect(source).toContain("transition-opacity duration-[160ms] motion-reduce:transition-none");
    expect(source).toContain('aria-busy={isArchiveTransitioning}');
  });

  it("offers direct page number selection alongside previous and next controls", () => {
    const source = sermonsSource();
    expect(source).toContain("const visiblePageNumbers = getPageNumbers(totalPages, visiblePage)");
    expect(source).toContain("{visiblePageNumbers.map((page, index) => (");
    expect(source).toContain("onClick={() => changeArchivePage(page)}");
  });
});
