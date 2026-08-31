import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isSundayMorningNewsletterSyncTime } from "./weeklyNewsletterScheduledHandler";

const eventsPage = readFileSync(new URL("../client/src/pages/Events.tsx", import.meta.url), "utf8");
const adminPanel = readFileSync(new URL("../client/src/components/AdminWeeklyNewsletterPanel.tsx", import.meta.url), "utf8");
const adminInbox = readFileSync(new URL("../client/src/pages/AdminInbox.tsx", import.meta.url), "utf8");
const scheduledHandler = readFileSync(new URL("./weeklyNewsletterScheduledHandler.ts", import.meta.url), "utf8");
const pdfPreview = readFileSync(new URL("../client/src/components/WeeklyNewsletterPdfPreview.tsx", import.meta.url), "utf8");
const weeklyNewsletterRouter = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const brandPageHero = readFileSync(new URL("../client/src/components/BrandPageHero.tsx", import.meta.url), "utf8");

describe("weekly newsletter experience", () => {
  it("shows the latest bulletin thumbnail directly below its issue date in the left tile with the previous archive on the right", () => {
    expect(eventsPage).toContain("trpc.weeklyNewsletter.latest.useQuery()");
    expect(eventsPage).toContain("trpc.weeklyNewsletter.list.useQuery(newsletterListInput)");
    expect(eventsPage).toContain("이번 주 교회 주보");
    expect(eventsPage).toContain("formatNewsletterDate(latestNewsletter.issueDate, lang)}</p><button");
    expect(eventsPage).toContain("group relative mt-4 block aspect-[3/4] w-full");
    expect(eventsPage).toContain("https://drive.google.com/thumbnail?id=${latestNewsletter.driveFileId}&sz=w1000");
    expect(eventsPage).not.toContain("footerContent={latestNewsletter ?");
    expect(brandPageHero).not.toContain("footerContent?: ReactNode");
    expect(eventsPage).toContain("지난 교회 주보");
    expect(eventsPage).toContain("lg:grid-cols-[minmax(0,0.86fr)_minmax(19rem,1.14fr)]");
    expect(eventsPage).toContain("useRef");
    expect(eventsPage).toContain("ResizeObserver");
    expect(eventsPage).toContain("latestNewsletterTileHeight");
    expect(eventsPage).toContain("lg:items-start");
    expect(eventsPage).toContain('className="min-w-0 lg:flex lg:min-h-0 lg:flex-col"');
    expect(eventsPage).toContain("lg:max-h-none lg:flex-1");
    expect(eventsPage).not.toContain("lg:h-[836px]");
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

  it("filters the previous bulletin archive by year and month without limiting long-lived archives to one year", () => {
    expect(eventsPage).toContain('const [newsletterYearFilter, setNewsletterYearFilter] = useState("all")');
    expect(eventsPage).toContain('const [newsletterMonthFilter, setNewsletterMonthFilter] = useState("all")');
    expect(eventsPage).toContain("const filteredPriorNewsletters");
    expect(eventsPage).toContain("연도 전체");
    expect(eventsPage).toContain("월 전체");
    expect(eventsPage).toContain("선택한 연도와 월에 해당하는 주보가 없습니다.");
    expect(eventsPage).toContain("({ limit: 100 })");
    expect(weeklyNewsletterRouter).toContain("max(100).default(12)");
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
