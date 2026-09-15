import { Resend } from "resend";
import { buildNewsletterSubscriptionUrl } from "./newsletterSubscription";

export const NEWSLETTER_NOTIFICATION_RECIPIENT = "info@graceway-baptist.org";
export const NEWSLETTER_FROM = "Graceway Weekly Newsletter <newsletter@graceway-baptist.org>";

type SubscriberEmailInput = {
  subscriberId: number;
  email: string;
  lang: "en" | "ko";
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildNewsletterConfirmationRequestEmail(input: SubscriberEmailInput, confirmationToken: string) {
  const link = buildNewsletterSubscriptionUrl("confirm", confirmationToken);
  const korean = input.lang === "ko";
  const title = korean ? "그레이스웨이 뉴스레터 구독 확인" : "Confirm your Graceway newsletter subscription";
  const action = korean ? "구독 확인하기" : "Confirm subscription";
  const intro = korean
    ? "그레이스웨이 침례교회 주간 주보와 소식을 받으려면 아래 버튼을 선택해 주세요."
    : "Use the button below to receive Graceway Baptist Church weekly bulletins and updates.";

  return {
    from: NEWSLETTER_FROM,
    to: [input.email],
    replyTo: NEWSLETTER_NOTIFICATION_RECIPIENT,
    subject: title,
    text: `${intro}\n\n${action}: ${link}\n\nThis link expires in 48 hours.`,
    html: [
      `<h1>${escapeHtml(title)}</h1>`,
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#17324D;color:#ffffff;padding:12px 18px;text-decoration:none">${escapeHtml(action)}</a></p>`,
      "<p>This confirmation link expires in 48 hours.</p>",
    ].join(""),
  };
}

export function buildNewsletterSubscriptionConfirmedEmail(input: SubscriberEmailInput, unsubscribeToken: string) {
  const unsubscribeLink = buildNewsletterSubscriptionUrl("unsubscribe", unsubscribeToken);
  const korean = input.lang === "ko";
  const title = korean ? "뉴스레터 구독이 완료되었습니다" : "Your Graceway newsletter subscription is confirmed";
  const intro = korean
    ? "그레이스웨이 침례교회 주간 주보와 주요 소식을 이메일로 보내드리겠습니다."
    : "We will send Graceway Baptist Church weekly bulletins and important updates to this address.";
  const unsubscribeText = korean ? "구독 취소" : "Unsubscribe";

  return {
    from: NEWSLETTER_FROM,
    to: [input.email],
    replyTo: NEWSLETTER_NOTIFICATION_RECIPIENT,
    subject: title,
    text: `${intro}\n\n${unsubscribeText}: ${unsubscribeLink}`,
    html: [
      `<h1>${escapeHtml(title)}</h1>`,
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${escapeHtml(unsubscribeLink)}">${escapeHtml(unsubscribeText)}</a></p>`,
    ].join(""),
  };
}

export function buildNewsletterStaffNotification(input: SubscriberEmailInput, kind: "requested" | "confirmed") {
  const isRequest = kind === "requested";
  const action = isRequest ? "New newsletter subscription request" : "Newsletter subscription confirmed";
  const status = isRequest ? "Pending email confirmation" : "Active";

  return {
    from: NEWSLETTER_FROM,
    to: [NEWSLETTER_NOTIFICATION_RECIPIENT],
    replyTo: input.email,
    subject: `${action}: ${input.email}`,
    text: [
      action,
      "",
      `Email: ${input.email}`,
      `Language: ${input.lang.toUpperCase()}`,
      `Status: ${status}`,
      `Subscriber ID: ${input.subscriberId}`,
    ].join("\n"),
    html: [
      `<h1>${escapeHtml(action)}</h1>`,
      "<table>",
      `<tr><th align="left">Email</th><td>${escapeHtml(input.email)}</td></tr>`,
      `<tr><th align="left">Language</th><td>${escapeHtml(input.lang.toUpperCase())}</td></tr>`,
      `<tr><th align="left">Status</th><td>${escapeHtml(status)}</td></tr>`,
      `<tr><th align="left">Subscriber ID</th><td>${input.subscriberId}</td></tr>`,
      "</table>",
    ].join(""),
  };
}

async function sendNewsletterEmail(payload: Record<string, unknown>, idempotencyKey: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Newsletter email service is not configured");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    ...payload,
    headers: { "Idempotency-Key": idempotencyKey },
    tags: [{ name: "category", value: "newsletter-subscription" }],
  } as unknown as Parameters<Resend["emails"]["send"]>[0]);

  if (error || !data?.id) throw new Error("Newsletter email was not accepted");
  return { id: data.id };
}

export function sendNewsletterConfirmationRequest(input: SubscriberEmailInput, confirmationToken: string, tokenHash: string) {
  return sendNewsletterEmail(
    buildNewsletterConfirmationRequestEmail(input, confirmationToken),
    `newsletter-confirm-request/${input.subscriberId}/${tokenHash}`,
  );
}

export function sendNewsletterSubscriptionConfirmedEmail(input: SubscriberEmailInput, unsubscribeToken: string, tokenHash: string) {
  return sendNewsletterEmail(
    buildNewsletterSubscriptionConfirmedEmail(input, unsubscribeToken),
    `newsletter-confirmed/${input.subscriberId}/${tokenHash}`,
  );
}

export function sendNewsletterStaffNotification(input: SubscriberEmailInput, kind: "requested" | "confirmed") {
  return sendNewsletterEmail(
    buildNewsletterStaffNotification(input, kind),
    `newsletter-staff-${kind}/${input.subscriberId}`,
  );
}
