import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getResponsiveWorshipsPerPage } from "../client/src/pages/Worship";

const worshipSource = () =>
  readFileSync(resolve(process.cwd(), "client/src/pages/Worship.tsx"), "utf8");

describe("worship archive pagination", () => {
  it("keeps archive cards within two rows at each grid breakpoint", () => {
    const source = worshipSource();
    expect(getResponsiveWorshipsPerPage(1440)).toBe(8);
    expect(getResponsiveWorshipsPerPage(1100)).toBe(6);
    expect(getResponsiveWorshipsPerPage(800)).toBe(4);
    expect(getResponsiveWorshipsPerPage(390)).toBe(2);
    expect(source).toContain("const paginatedWorships = filtered.slice(pageStart, pageStart + worshipsPerPage)");
    expect(source).toContain("paginatedWorships.map((w) => (");
  });

  it("returns to the first page when the worship search changes", () => {
    const source = worshipSource();
    expect(source).toContain("setSearch(e.target.value);");
    expect(source).toContain("setCurrentPage(1);");
  });

  it("provides labelled previous, direct, and next controls with boundary protection", () => {
    const source = worshipSource();
    expect(source).toContain('aria-label={lang === "ko" ? "찬양 목록 페이지 탐색"');
    expect(source).toContain("disabled={visiblePage === 1 || isArchiveTransitioning}");
    expect(source).toContain("disabled={visiblePage === totalPages || isArchiveTransitioning}");
    expect(source).toContain("const visiblePageNumbers = getPageNumbers(totalPages, visiblePage)");
    expect(source).toContain("onClick={() => changeArchivePage(page)}");
    expect(source).toContain("{visiblePage} / {totalPages}");
    expect(source).toContain("hidden items-center gap-2 sm:flex");
  });

  it("fades the archive on page changes and respects reduced motion without removing sharing", () => {
    const source = worshipSource();
    expect(source).toContain("const ARCHIVE_FADE_DURATION_MS = 160");
    expect(source).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches');
    expect(source).toContain('aria-busy={isArchiveTransitioning}');
    expect(source).toContain('transition-opacity duration-[160ms] motion-reduce:transition-none');
    expect(source.match(/contentType="worship"/g)).toHaveLength(3);
  });
});
