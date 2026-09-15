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
    });

    expect(email.from).toContain("newsletter@graceway-baptist.org");
    expect(email.replyTo).toBe("info@graceway-baptist.org");
    expect(email.to).toEqual(["reader@example.com"]);
    expect(email.html).toContain("9월 20일 주보");
    expect(email.html).toContain("safe-test-token");
    expect(email.text).toContain("뉴스레터 구독 취소");
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
