import { describe, expect, it } from "vitest";
import { Resend } from "resend";
import { Webhook } from "standardwebhooks";

describe("Resend webhook signing secret", () => {
  it("verifies a signed event without exposing the configured secret", () => {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    expect(secret).toBeTruthy();

    const payload = JSON.stringify({
      type: "email.delivered",
      created_at: "2026-09-15T07:10:00.000Z",
      data: { email_id: "test-email-id", tags: { category: "weekly-newsletter" } },
    });
    const timestamp = new Date();
    const signature = new Webhook(secret!).sign("msg_newsletter_secret_validation", timestamp, payload);
    const verified = new Resend("re_not_used_for_webhook_verification").webhooks.verify({
      payload,
      headers: {
        id: "msg_newsletter_secret_validation",
        timestamp: String(Math.floor(timestamp.getTime() / 1000)),
        signature,
      },
      webhookSecret: secret!,
    }) as { type: string; data: { email_id: string } };

    expect(verified.type).toBe("email.delivered");
    expect(verified.data.email_id).toBe("test-email-id");
  });
});
