import { beforeEach, describe, expect, it, vi } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const {
  CONTACT_NOTIFICATION_FROM,
  CONTACT_NOTIFICATION_RECIPIENT,
  buildContactEmailNotification,
  sendContactEmailNotification,
} = await import("./contactEmail");

const inquiry = {
  contactId: 42,
  firstName: "Grace",
  lastName: "Kim",
  email: "visitor@example.com",
  phone: "510-529-5636",
  topic: "visit" as const,
  message: "<script>must not render</script>",
};

describe("contact email notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_contact_key";
    send.mockResolvedValue({ data: { id: "email_123" }, error: null });
  });

  it("uses the authenticated church sender, Gmail recipient, and visitor reply-to", () => {
    const email = buildContactEmailNotification(inquiry);

    expect(email).toMatchObject({
      from: CONTACT_NOTIFICATION_FROM,
      to: [CONTACT_NOTIFICATION_RECIPIENT],
      replyTo: "visitor@example.com",
      subject: "New website inquiry: Grace Kim",
    });
    expect(email.from).not.toContain(inquiry.email);
    expect(email.html).toContain("&lt;script&gt;must not render&lt;/script&gt;");
    expect(email.html).not.toContain("<script>must not render</script>");
  });

  it("sends one idempotent transactional message and returns only its provider id", async () => {
    await expect(sendContactEmailNotification(inquiry)).resolves.toEqual({ id: "email_123" });

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      from: CONTACT_NOTIFICATION_FROM,
      to: [CONTACT_NOTIFICATION_RECIPIENT],
      replyTo: inquiry.email,
      headers: { "Idempotency-Key": "contact-form/42" },
    }));
  });

  it("does not surface provider response details when Resend rejects a message", async () => {
    send.mockResolvedValue({ data: null, error: { message: "provider detail" } });

    await expect(sendContactEmailNotification(inquiry)).rejects.toThrow(
      "Contact email notification was not accepted",
    );
  });
});
