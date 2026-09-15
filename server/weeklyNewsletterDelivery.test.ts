import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildWeeklyNewsletterEmail } from "./weeklyNewsletterDelivery";
import { isSundayMorningNewsletterSyncTime } from "./weeklyNewsletterScheduledHandler";

const deliveryService = readFileSync(new URL("./weeklyNewsletterDelivery.ts", import.meta.url), "utf8");
const deliveryWebhook = readFileSync(new URL("./weeklyNewsletterDeliveryWebhook.ts", import.meta.url), "utf8");
const deliverySchedule = readFileSync(new URL("./weeklyNewsletterDeliveryScheduledHandler.ts", import.meta.url), "utf8");
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

  it("protects the scheduled delivery callback with the persisted cron identity and church-time 9 AM guard", () => {
    expect(deliverySchedule).toContain('"/api/scheduled/weekly-newsletter-delivery"');
    expect(deliverySchedule).toContain("user.isCron");
    expect(deliverySchedule).toContain("settings.scheduleCronTaskUid !== user.taskUid");
    expect(deliverySchedule).toContain("isSundayMorningNewsletterSyncTime");
    expect(deliverySchedule).toContain("deliverLatestWeeklyNewsletter");
    expect(isSundayMorningNewsletterSyncTime(new Date("2026-09-20T16:00:00.000Z"))).toBe(true);
    expect(isSundayMorningNewsletterSyncTime(new Date("2026-11-01T17:00:00.000Z"))).toBe(true);
  });

  it("shows staff campaign counts and a guarded manual latest-bulletin send control", () => {
    expect(adminPanel).toContain("trpc.weeklyNewsletter.deliveryStatus.useQuery");
    expect(adminPanel).toContain("trpc.weeklyNewsletter.sendLatestNow.useMutation");
    expect(adminPanel).toContain("deliverySettings?.deliveryEnabled");
    expect(adminPanel).toContain("최근 수신자");
    expect(adminPanel).toContain("오류·반송");
  });
});
