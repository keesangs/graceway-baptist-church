import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const {
  NEWSLETTER_FROM,
  NEWSLETTER_NOTIFICATION_RECIPIENT,
  buildNewsletterConfirmationRequestEmail,
  buildNewsletterStaffNotification,
  buildNewsletterSubscriptionConfirmedEmail,
  sendNewsletterConfirmationRequest,
} = await import("./newsletterSubscriptionEmail");
const {
  NEWSLETTER_PUBLIC_ORIGIN,
  buildNewsletterSubscriptionUrl,
  createNewsletterToken,
  getNewsletterTokenExpiry,
  hashNewsletterToken,
} = await import("./newsletterSubscription");

const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const homePage = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const confirmationPage = readFileSync(new URL("../client/src/pages/NewsletterConfirmation.tsx", import.meta.url), "utf8");
const unsubscribePage = readFileSync(new URL("../client/src/pages/NewsletterUnsubscribe.tsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");

const subscriber = { subscriberId: 11, email: "member@example.com", lang: "ko" as const };
const token = "a".repeat(43);

describe("newsletter subscription lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_newsletter_key";
    send.mockResolvedValue({ data: { id: "email_newsletter_123" }, error: null });
  });

  it("creates URL-safe opaque tokens and only stores a non-reversible hash contract", () => {
    const generated = createNewsletterToken();
    expect(generated).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(hashNewsletterToken(generated)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashNewsletterToken(generated)).not.toContain(generated);
    expect(getNewsletterTokenExpiry(new Date("2026-09-14T00:00:00.000Z")).toISOString()).toBe("2026-09-16T00:00:00.000Z");
    expect(getNewsletterTokenExpiry(new Date("2026-09-14T00:00:00.000Z"), "unsubscribe").toISOString()).toBe("2027-09-14T00:00:00.000Z");
  });

  it("uses the verified newsletter sender and does not expose recipients in staff notifications", () => {
    const confirmation = buildNewsletterConfirmationRequestEmail(subscriber, token);
    const confirmed = buildNewsletterSubscriptionConfirmedEmail(subscriber, token);
    const staff = buildNewsletterStaffNotification(subscriber, "requested");

    expect(confirmation).toMatchObject({ from: NEWSLETTER_FROM, to: [subscriber.email], replyTo: NEWSLETTER_NOTIFICATION_RECIPIENT });
    expect(confirmation.html).toContain(`${NEWSLETTER_PUBLIC_ORIGIN}/newsletter/confirm/${token}`);
    expect(confirmed.html).toContain(`${NEWSLETTER_PUBLIC_ORIGIN}/newsletter/unsubscribe/${token}`);
    expect(staff).toMatchObject({ from: NEWSLETTER_FROM, to: [NEWSLETTER_NOTIFICATION_RECIPIENT], replyTo: subscriber.email });
    expect(staff.from).not.toContain(subscriber.email);
  });

  it("sends a confirmation email with a per-request idempotency key", async () => {
    await expect(sendNewsletterConfirmationRequest(subscriber, token, "b".repeat(64))).resolves.toEqual({ id: "email_newsletter_123" });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      from: NEWSLETTER_FROM,
      to: [subscriber.email],
      headers: { "Idempotency-Key": `newsletter-confirm-request/${subscriber.subscriberId}/${"b".repeat(64)}` },
    }));
  });

  it("preserves a pending request when notification sending fails and keeps a generic public response", () => {
    const persistenceIndex = routerSource.indexOf("requestNewsletterSubscription({");
    const notificationIndex = routerSource.indexOf("sendNewsletterConfirmationRequest(emailInput", persistenceIndex);
    expect(persistenceIndex).toBeGreaterThan(-1);
    expect(notificationIndex).toBeGreaterThan(persistenceIndex);
    expect(routerSource).toContain("Promise.allSettled");
    expect(routerSource).toContain("subscription request remains stored");
    expect(routerSource).toContain("confirmationRequired: true");
  });

  it("does not silently reactivate an unsubscribed recipient and issues confirmation tokens as hashes", () => {
    expect(dbSource).toContain("status: \"pending\"");
    expect(dbSource).toContain("isActive: 0");
    expect(dbSource).toContain("createNewsletterTokenForSubscriber(refreshed.id, \"confirm\")");
    expect(dbSource).toContain("hashNewsletterToken(rawToken)");
    expect(dbSource).not.toContain("set: { lang: data.lang ?? \"en\", isActive: 1 }");
  });

  it("uses explicit confirmation and unsubscribe buttons instead of mutating on page load", () => {
    expect(confirmationPage).toContain("Confirm subscription");
    expect(confirmationPage).toContain("mutation.mutate({ token })");
    expect(unsubscribePage).toContain("Unsubscribe");
    expect(unsubscribePage).toContain("onClick={() => token && mutation.mutate({ token })}");
    expect(homePage).toContain("Please confirm your subscription by email");
    expect(appSource).toContain('path="/newsletter/confirm/:token"');
    expect(appSource).toContain('path="/newsletter/unsubscribe/:token"');
  });
});
