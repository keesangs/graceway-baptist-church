import { Resend } from "resend";

export const CONTACT_NOTIFICATION_RECIPIENT = "info@graceway-baptist.org";
export const CONTACT_NOTIFICATION_FROM = "Graceway Website <notifications@graceway-baptist.org>";

export type ContactEmailInput = {
  contactId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  topic: "visit" | "prayer" | "ministry" | "general";
  message: string | null;
};

const TOPIC_LABELS: Record<ContactEmailInput["topic"], string> = {
  visit: "Plan a visit",
  prayer: "Prayer request",
  ministry: "Ministry involvement",
  general: "General question",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Builds the notification content separately from delivery so its recipient,
 * authenticated sender, and reply-to contract can be unit tested without
 * touching a live mailbox. Visitor text is escaped before it enters HTML.
 */
export function buildContactEmailNotification(input: ContactEmailInput) {
  const fullName = `${input.firstName} ${input.lastName}`;
  const topic = TOPIC_LABELS[input.topic];
  const phone = input.phone ?? "Not provided";
  const message = input.message ?? "(No message provided)";

  return {
    from: CONTACT_NOTIFICATION_FROM,
    to: [CONTACT_NOTIFICATION_RECIPIENT],
    replyTo: input.email,
    subject: `New website inquiry: ${fullName}`,
    text: [
      "New website inquiry",
      "",
      `Name: ${fullName}`,
      `Email: ${input.email}`,
      `Phone: ${phone}`,
      `Topic: ${topic}`,
      "",
      message,
    ].join("\n"),
    html: [
      "<h1>New website inquiry</h1>",
      "<table>",
      `<tr><th align=\"left\">Name</th><td>${escapeHtml(fullName)}</td></tr>`,
      `<tr><th align=\"left\">Email</th><td>${escapeHtml(input.email)}</td></tr>`,
      `<tr><th align=\"left\">Phone</th><td>${escapeHtml(phone)}</td></tr>`,
      `<tr><th align=\"left\">Topic</th><td>${escapeHtml(topic)}</td></tr>`,
      "</table>",
      "<h2>Message</h2>",
      `<p style=\"white-space: pre-wrap\">${escapeHtml(message)}</p>`,
    ].join(""),
  };
}

/**
 * Sends one notification for an already-persisted contact message. The contact
 * ID becomes a 24-hour Resend idempotency key, preventing duplicate delivery if
 * the caller retries after a network interruption.
 */
export async function sendContactEmailNotification(input: ContactEmailInput): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Contact email service is not configured");
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    ...buildContactEmailNotification(input),
    headers: { "Idempotency-Key": `contact-form/${input.contactId}` },
    tags: [
      { name: "category", value: "website-contact" },
      { name: "topic", value: input.topic },
    ],
  });

  if (error || !data?.id) {
    // Do not interpolate the provider error here: a caller must never write
    // visitor-submitted data or transport details to an application log.
    throw new Error("Contact email notification was not accepted");
  }

  return { id: data.id };
}
