import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isSundayMorningNewsletterSyncTime } from "./weeklyNewsletterScheduledHandler";

const eventsPage = readFileSync(new URL("../client/src/pages/Events.tsx", import.meta.url), "utf8");
const adminPanel = readFileSync(new URL("../client/src/components/AdminWeeklyNewsletterPanel.tsx", import.meta.url), "utf8");
const adminInbox = readFileSync(new URL("../client/src/pages/AdminInbox.tsx", import.meta.url), "utf8");
const scheduledHandler = readFileSync(new URL("./weeklyNewsletterScheduledHandler.ts", import.meta.url), "utf8");
const pdfPreview = readFileSync(new URL("../client/src/components/WeeklyNewsletterPdfPreview.tsx", import.meta.url), "utf8");

describe("weekly newsletter experience", () => {
  it("shows the latest bulletin as a left preview with the previous archive as a right-hand list", () => {
    expect(eventsPage).toContain("trpc.weeklyNewsletter.latest.useQuery()");
    expect(eventsPage).toContain("trpc.weeklyNewsletter.list.useQuery(newsletterListInput)");
    expect(eventsPage).toContain("이번 주 교회 주보");
    expect(eventsPage).toContain("aspect-[3/4]");
    expect(eventsPage).toContain("지난 교회 주보");
    expect(eventsPage).toContain("lg:grid-cols-[minmax(0,0.86fr)_minmax(19rem,1.14fr)]");
    expect(eventsPage).toContain("https://drive.google.com/thumbnail?id=${latestNewsletter.driveFileId}&sz=w1000");
    expect(eventsPage).toContain("setPreviewIssue(latestNewsletter)");
    expect(eventsPage).toContain("setPreviewIssue(issue)");
    expect(eventsPage).toContain("다운로드");
  });

  it("opens the selected bulletin in an accessible in-page PDF preview", () => {
    expect(eventsPage).toContain("WeeklyNewsletterPdfPreview");
    expect(pdfPreview).toContain("<Dialog open={Boolean(issue)}");
    expect(pdfPreview).toContain("PDF 미리보기");
    expect(pdfPreview).toContain("https://drive.google.com/file/d/${issue.driveFileId}/preview");
    expect(pdfPreview).toContain("주보 미리보기 닫기");
  });

  it("provides a staff-only sync retry and publishing controls in Admin", () => {
    expect(adminInbox).toContain('key: "bulletins" as Tab');
    expect(adminInbox).toContain("AdminWeeklyNewsletterPanel");
    expect(adminPanel).toContain("trpc.weeklyNewsletter.syncNow.useMutation");
    expect(adminPanel).toContain("trpc.weeklyNewsletter.update.useMutation");
    expect(adminPanel).toContain("지금 동기화");
  });

  it("limits scheduled publication to the persisted newsletter cron identity", () => {
    expect(scheduledHandler).toContain('"/api/scheduled/weekly-newsletter-sync"');
    expect(scheduledHandler).toContain("user.isCron");
    expect(scheduledHandler).toContain("settings.scheduleCronTaskUid !== user.taskUid");
    expect(scheduledHandler).toContain("syncPublicWeeklyNewsletterArchive");
  });

  it("runs only at Sunday 9 AM in church time across daylight saving changes", () => {
    expect(isSundayMorningNewsletterSyncTime(new Date("2026-08-30T16:00:00.000Z"))).toBe(true);
    expect(isSundayMorningNewsletterSyncTime(new Date("2026-11-01T17:00:00.000Z"))).toBe(true);
    expect(isSundayMorningNewsletterSyncTime(new Date("2026-08-30T15:00:00.000Z"))).toBe(false);
  });
});
