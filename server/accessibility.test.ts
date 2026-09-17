import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("critical navigation and contact-form accessibility", () => {
  it("keeps primary and compact navigation labelled with visible keyboard focus treatment", () => {
    const navbar = source("client/src/components/Navbar.tsx");

    expect(navbar).toContain('aria-label="Primary navigation"');
    expect(navbar).toContain('aria-label="Compact navigation"');
    expect(navbar).toContain("aria-expanded={mobileOpen}");
    expect(navbar).toContain("focus-visible:outline-[#D9B87A]");
  });

  it("associates every Connect form control with a programmatic label", () => {
    const connect = source("client/src/pages/Connect.tsx");

    [
      "contact-first-name",
      "contact-last-name",
      "contact-email",
      "contact-phone",
      "contact-topic",
      "contact-message",
    ].forEach((id) => {
      expect(connect).toContain(`htmlFor="${id}"`);
      expect(connect).toContain(`id="${id}"`);
    });
  });

  it("gives icon-only controls and staff forms explicit names across key feature pages", () => {
    const meditation = source("client/src/pages/Meditation.tsx");
    const media = source("client/src/pages/MediaLibrary.tsx");
    const adminDailyBible = source("client/src/pages/AdminDailyBible.tsx");

    expect(meditation).toContain('aria-label={lang === "ko" ? "이전 묵상"');
    expect(meditation).toContain('aria-label={lang === "ko" ? "다음 묵상"');
    expect(meditation).toContain('aria-label={lang === "ko" ? `${item.verse} 구절 복사`');
    expect(meditation).toContain("focus-visible:opacity-100");
    expect(meditation).toContain("aria-expanded={replyingToId === comment.id}");
    expect(meditation).toContain('aria-label={lang === "ko" ? `나눔 공감 ${comment.likeCount}`');
    expect(media).toContain('role="button"');
    expect(media).toContain("onKeyDown={handleDropzoneKeyDown}");
    expect(media).toContain('aria-label="Select a file to upload"');
    expect(media).toContain('aria-label="Clear selected file"');
    expect(media).toContain("aria-label={`Delete ${file.filename}`}");

    [
      "admin-meditation-date",
      "admin-scripture-reference",
      "admin-scripture-text",
      "admin-title",
      "admin-content",
      "admin-scripture-reference-en",
      "admin-scripture-text-en",
      "admin-title-en",
      "admin-content-en",
    ].forEach((id) => {
      expect(adminDailyBible).toContain(`htmlFor="${id}"`);
      expect(adminDailyBible).toContain(`id="${id}"`);
    });
  });

  it("keeps shared keyboard-focus treatment and labelled interactive controls across all remaining key routes", () => {
    const styles = source("client/src/index.css");
    const home = source("client/src/pages/Home.tsx");
    const about = source("client/src/pages/About.tsx");
    const sermons = source("client/src/pages/Sermons.tsx");
    const worship = source("client/src/pages/Worship.tsx");
    const ministries = source("client/src/pages/Ministries.tsx");
    const adminInbox = source("client/src/pages/AdminInbox.tsx");

    expect(styles).toContain(':where(a, button, input, textarea, select, [role="button"]):focus-visible');
    expect(styles).toContain("outline: 2px solid #0B2C43");
    expect(styles).toContain("box-shadow: 0 0 0 4px #D9B87A");

    expect(home).toContain('href="/connect"');
    expect(home).toContain('href="/sermons"');
    expect(home).toContain('aria-label={t("home.emailPlaceholder")}');
    expect(about).toContain("<BrandPageHero");
    expect(sermons).toContain('aria-label={t("sermons.searchPlaceholder")}');
    expect(sermons).toContain('aria-label={lang === "ko" ? `${s.titleKo} 설교 재생`');
    expect(worship).toContain('aria-label={lang === "ko" ? "찬양 검색"');
    expect(worship).toContain('aria-label={lang === "ko" ? `${w.titleKo} 찬양 재생`');
    expect(ministries).toContain('href="/connect"');
    expect(adminInbox).toContain("Refresh");
    expect(adminInbox).toContain("Export CSV");
    expect(adminInbox).toContain("aria-pressed={tab === item.key}");
  });
});
