import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildWeeklyNewsletterBulletinUrl, buildWeeklyNewsletterEmail } from "./weeklyNewsletterDelivery";
import { isSundayMorningNewsletterSyncTime } from "./weeklyNewsletterScheduledHandler";

const deliveryService = readFileSync(new URL("./weeklyNewsletterDelivery.ts", import.meta.url), "utf8");
const deliveryWebhook = readFileSync(new URL("./weeklyNewsletterDeliveryWebhook.ts", import.meta.url), "utf8");
const syncSchedule = readFileSync(new URL("./weeklyNewsletterScheduledHandler.ts", import.meta.url), "utf8");
const adminPanel = readFileSync(new URL("../client/src/components/AdminWeeklyNewsletterPanel.tsx", import.meta.url), "utf8");
const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");

describe("weekly newsletter delivery", () => {
  it("creates a bilingual bulletin email with authenticated sender, reply-to, and recipient-specific unsubscribe link", () => {
    const email = buildWeeklyNewsletterEmail({
      email: "reader@example.com",
      lang: "ko",
      issueDate: "2026-09-20",
      titleKo: "9월 20일 주보",
      titleEn: "September 20 Bulletin",
      bulletinUrl: "https://example.com/bulletin.pdf",
      unsubscribeToken: "safe-test-token",
      highlight: {
        titleKo: "홈커밍 연합예배",
        titleEn: "Homecoming Union Service",
        descriptionKo: "함께 예배하며 은혜를 나누는 특별한 시간을 준비했습니다.",
        descriptionEn: "Join us for a special time of worship and fellowship.",
        date: "2026-10-04T20:30:00.000Z",
        imageUrl: "/manus-storage/homecoming-poster.png",
        href: "/events?event=42",
      },
    });

    expect(email.from).toContain("newsletter@graceway-baptist.org");
    expect(email.replyTo).toBe("info@graceway-baptist.org");
    expect(email.to).toEqual(["reader@example.com"]);
    expect(email.html).toContain("9월 20일 주보");
    expect(email.html).toContain("https://graceway-baptist.org/manus-storage/graceway-logo-dark-updated_bda9aced.png");
    expect(email.html).toContain("Graceway Baptist Church · 그레이스웨이 침례교회");
    expect(email.html).toContain("그레이스웨이 주간 주보");
    expect(email.html).toContain("2791 Driscoll Rd, Fremont, CA 94539");
    expect(email.html).toContain("주일 예배 · 오후 1:30");
    expect(email.html).toContain("https://www.facebook.com/people/Graceway-Baptist-Church/61594452553986/");
    expect(email.html).toContain("https://www.instagram.com/gracewaybaptistchurchfremont");
    expect(email.html).toContain("https://www.youtube.com/@Graceway-Baptist");
    expect(email.html).toContain('aria-label="페이스북"');
    expect(email.html).toContain('aria-label="인스타그램"');
    expect(email.html).toContain('aria-label="유튜브"');
    expect(email.html).toContain("background:#1877F2");
    expect(email.html).toContain("background:#E4405F");
    expect(email.html).toContain("background:#FF0000");
    expect(email.html).toContain('viewBox="0 0 24 24"');
    expect(email.html).toContain('d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"');
    expect(email.html).toContain('d="M2.5 17a24.12 24.12 0 0 1 0-10');
    expect(email.html).toContain('d="m10 15 5-3-5-3z"');
    expect(email.html).not.toContain(">◎<");
    expect(email.html).not.toContain(">▶<");
    expect(email.html).toContain("다가오는 교회 행사");
    expect(email.html).toContain("홈커밍 연합예배");
    expect(email.html).toContain("함께 예배하며 은혜를 나누는 특별한 시간을 준비했습니다.");
    expect(email.html).toContain("https://graceway-baptist.org/manus-storage/homecoming-poster.png");
    expect(email.html).toContain("https://graceway-baptist.org/events?event=42");
    expect(email.html).toContain("safe-test-token");
    expect(email.text).toContain("Graceway Baptist Church · 그레이스웨이 침례교회");
    expect(email.text).toContain("Address: 2791 Driscoll Rd, Fremont, CA 94539");
    expect(email.text).toContain("예배 시간 / Service times: 주일 예배 · 오후 1:30 · 수요 기도회 · 오후 8:00");
    expect(email.text).toContain("뉴스레터 구독 취소");
  });

  it("keeps the email-safe banner accessible when the logo image is unavailable", () => {
    const email = buildWeeklyNewsletterEmail({
      email: "reader@example.com",
      lang: "en",
      issueDate: "2026-09-20",
      titleKo: "9월 20일 주보",
      titleEn: "September 20 Bulletin",
      bulletinUrl: "https://example.com/bulletin.pdf",
      unsubscribeToken: "safe-test-token",
      highlight: {
        titleKo: "Homecoming 연합예배",
        titleEn: "Homecoming Union Service",
        descriptionKo: "함께 예배하며 교제하는 특별한 예배입니다.",
        descriptionEn: "A special service for worship and fellowship together.",
        date: "2026-10-04T20:30:00.000Z",
        imageUrl: "https://example.com/homecoming.png",
        href: "https://graceway-baptist.org/events?event=42",
      },
    });

    expect(email.html).toContain('alt="Graceway Baptist Church · 그레이스웨이 침례교회"');
    expect(email.text).toContain("Graceway Weekly Newsletter");
    expect(email.text).toContain("Address: 2791 Driscoll Rd, Fremont, CA 94539");
    expect(email.text).toContain("예배 시간 / Service times: Sunday worship · 1:30 PM · Wednesday prayer · 8:00 PM");
    expect(email.text).toContain("Upcoming at Graceway");
    expect(email.text).toContain("Homecoming Union Service");
    expect(email.text).not.toContain("홈커밍(Homecoming) 예배로 영어부과 연합으로 드립니다.");
    expect(email.html).not.toContain("<style");
    expect(email.html).not.toContain("javascript:");
  });

  it("converts site-local bulletin storage paths to canonical HTTPS links for email clients", () => {
    const bulletinUrl = buildWeeklyNewsletterBulletinUrl("/manus-storage/weekly-newsletters/2026-09-13_bulletin.pdf");
    const email = buildWeeklyNewsletterEmail({
      email: "reader@example.com",
      lang: "en",
      issueDate: "2026-09-13",
      titleKo: "9월 13일 주보",
      titleEn: "September 13 Bulletin",
      bulletinUrl: "/manus-storage/weekly-newsletters/2026-09-13_bulletin.pdf",
      unsubscribeToken: "safe-test-token",
    });

    expect(bulletinUrl).toBe("https://graceway-baptist.org/manus-storage/weekly-newsletters/2026-09-13_bulletin.pdf");
    expect(email.html).toContain(`href="${bulletinUrl}"`);
    expect(email.text).toContain(bulletinUrl);
    expect(email.html).not.toContain("http:///");
  });

  it("uses issue and subscriber uniqueness plus provider idempotency to prevent duplicate sends", () => {
    expect(schema).toContain('issueId: int("issueId").notNull().unique()');
    expect(schema).toContain('weekly_newsletter_delivery_campaign_subscriber_unique');
    expect(deliveryService).toContain('`weekly-newsletter/${campaign.id}/${subscriber.id}`');
    expect(deliveryService).toContain('["sent", "skipped"].includes(campaign.status)');
    expect(deliveryService).toContain('claimWeeklyNewsletterDelivery');
  });

  it("filters inactive subscribers before send and marks suppressed or unsubscribed recipients as excluded", () => {
    expect(deliveryService).toContain("listActiveNewsletterSubscribers");
    expect(deliveryService).toContain('subscriber.status === "suppressed"');
    expect(deliveryService).toContain('subscriber.status === "unsubscribed"');
    expect(deliveryService).toContain("markWeeklyNewsletterDeliveryExcluded");
  });

  it("verifies raw Resend webhook payloads and deduplicates provider events before changing delivery status", () => {
    expect(deliveryWebhook).toContain('express.raw({ type: "application/json" })');
    expect(deliveryWebhook).toContain("resend.webhooks.verify");
    expect(deliveryWebhook).toContain('"svix-id"');
    expect(deliveryWebhook).toContain('"svix-timestamp"');
    expect(deliveryWebhook).toContain('"svix-signature"');
    expect(deliveryWebhook).toContain("recordWeeklyNewsletterProviderEvent");
    expect(schema).toContain('providerEventId: varchar("providerEventId", { length: 128 }).notNull().unique()');
  });

  it("uses the existing persisted Sunday sync cron as the sole protected delivery trigger", () => {
    expect(syncSchedule).toContain('"/api/scheduled/weekly-newsletter-sync"');
    expect(syncSchedule).toContain("user.isCron");
    expect(syncSchedule).toContain("settings.scheduleCronTaskUid !== user.taskUid");
    expect(syncSchedule).toContain("isSundayMorningNewsletterSyncTime");
    expect(syncSchedule).toContain("deliverLatestWeeklyNewsletter");
    expect(isSundayMorningNewsletterSyncTime(new Date("2026-09-20T16:00:00.000Z"))).toBe(true);
    expect(isSundayMorningNewsletterSyncTime(new Date("2026-11-01T17:00:00.000Z"))).toBe(true);
  });

  it("delivers only after the existing Sunday bulletin synchronization has completed", () => {
    expect(syncSchedule).toContain("const result = await syncPublicWeeklyNewsletterArchive();");
    expect(syncSchedule).toContain("const delivery = await deliverLatestWeeklyNewsletter();");
    expect(syncSchedule.indexOf("syncPublicWeeklyNewsletterArchive()")).toBeLessThan(syncSchedule.indexOf("deliverLatestWeeklyNewsletter()"));
  });

  it("shows staff campaign counts and a guarded manual latest-bulletin send control", () => {
    expect(adminPanel).toContain("trpc.weeklyNewsletter.deliveryStatus.useQuery");
    expect(adminPanel).toContain("trpc.weeklyNewsletter.sendLatestNow.useMutation");
    expect(adminPanel).toContain("trpc.weeklyNewsletter.setDeliveryEnabled.useMutation");
    expect(adminPanel).toContain("주간 주보 이메일 자동 발송");
    expect(adminPanel).toContain("deliverySettings?.deliveryEnabled");
    expect(adminPanel).toContain("최근 수신자");
    expect(adminPanel).toContain("오류·반송");
  });
});
