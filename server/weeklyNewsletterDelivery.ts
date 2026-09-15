import { Resend } from "resend";
import {
  claimWeeklyNewsletterDelivery,
  createWeeklyNewsletterUnsubscribeToken,
  ensureWeeklyNewsletterCampaignDeliveries,
  getLatestPublishedWeeklyNewsletterIssue,
  getNewsletterSubscriberById,
  getOrCreateWeeklyNewsletterCampaign,
  getWeeklyNewsletterDeliverySettings,
  listActiveNewsletterSubscribers,
  listWeeklyNewsletterCampaignDeliveries,
  markWeeklyNewsletterCampaignSending,
  markWeeklyNewsletterDeliveryExcluded,
  markWeeklyNewsletterDeliveryFailed,
  markWeeklyNewsletterDeliverySent,
  refreshWeeklyNewsletterCampaignCounts,
  updateWeeklyNewsletterDeliverySettings,
} from "./db";
import { buildNewsletterSubscriptionUrl } from "./newsletterSubscription";
import { NEWSLETTER_FROM, NEWSLETTER_NOTIFICATION_RECIPIENT } from "./newsletterSubscriptionEmail";

const CHURCH_TIME_ZONE = "America/Los_Angeles";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function bulletinDate(issueDate: string, lang: "ko" | "en") {
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    timeZone: CHURCH_TIME_ZONE,
    year: "numeric",
    month: lang === "ko" ? "long" : "long",
    day: "numeric",
  }).format(new Date(`${issueDate}T12:00:00Z`));
}

function campaignSubject(issueDate: string) {
  return `Graceway Weekly Bulletin — ${issueDate}`;
}

export function buildWeeklyNewsletterEmail(input: {
  email: string;
  lang: "ko" | "en";
  issueDate: string;
  titleKo: string;
  titleEn: string | null;
  bulletinUrl: string;
  unsubscribeToken: string;
}) {
  const ko = input.lang === "ko";
  const title = (ko ? input.titleKo : input.titleEn) || input.titleKo;
  const date = bulletinDate(input.issueDate, input.lang);
  const unsubscribeUrl = buildNewsletterSubscriptionUrl("unsubscribe", input.unsubscribeToken);
  const heading = ko ? "이번 주 교회 주보" : "This Week's Church Bulletin";
  const intro = ko
    ? "그레이스웨이 침례교회의 이번 주 주보와 주요 안내를 확인해 주세요."
    : "Please review this week's Graceway Baptist Church bulletin and important announcements.";
  const viewLabel = ko ? "주보 보기" : "View bulletin";
  const downloadLabel = ko ? "PDF 다운로드" : "Download PDF";
  const unsubscribeLabel = ko ? "뉴스레터 구독 취소" : "Unsubscribe";

  return {
    from: NEWSLETTER_FROM,
    to: [input.email],
    replyTo: NEWSLETTER_NOTIFICATION_RECIPIENT,
    subject: ko ? `그레이스웨이 주간 주보 — ${date}` : `Graceway Weekly Bulletin — ${date}`,
    text: [heading, "", title, intro, "", `${viewLabel}: ${input.bulletinUrl}`, `${downloadLabel}: ${input.bulletinUrl}`, "", `${unsubscribeLabel}: ${unsubscribeUrl}`].join("\n"),
    html: [
      '<div style="max-width:620px;margin:0 auto;font-family:Arial,sans-serif;color:#242A30;line-height:1.6">',
      '<p style="color:#C9973E;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase">Graceway Baptist Church</p>',
      `<h1 style="color:#17324D;font-family:Georgia,serif">${escapeHtml(heading)}</h1>`,
      `<p style="font-size:18px;font-weight:700;color:#17324D">${escapeHtml(title)}</p>`,
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${escapeHtml(input.bulletinUrl)}" style="display:inline-block;background:#17324D;color:#fff;padding:12px 18px;text-decoration:none">${escapeHtml(viewLabel)}</a></p>`,
      `<p><a href="${escapeHtml(input.bulletinUrl)}" style="color:#2F6F9F">${escapeHtml(downloadLabel)}</a></p>`,
      '<hr style="border:0;border-top:1px solid #e2e8ea;margin:28px 0">',
      `<p style="font-size:12px;color:#607A91"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#607A91">${escapeHtml(unsubscribeLabel)}</a></p>`,
      "</div>",
    ].join(""),
  };
}

async function sendWeeklyNewsletterEmail(payload: Record<string, unknown>, idempotencyKey: string, campaignId: number, subscriberId: number) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Newsletter email service is not configured");
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    ...payload,
    headers: { "Idempotency-Key": idempotencyKey },
    tags: [
      { name: "category", value: "weekly-newsletter" },
      { name: "campaign_id", value: String(campaignId) },
      { name: "subscriber_id", value: String(subscriberId) },
    ],
  } as unknown as Parameters<Resend["emails"]["send"]>[0]);
  if (error || !data?.id) throw new Error("Weekly newsletter email was not accepted");
  return data.id;
}

async function sendWeeklyNewsletterStaffSummary(input: { issueDate: string; campaignId: number; totalRecipients: number; sentCount: number; failedCount: number; skippedCount: number }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Newsletter email service is not configured");
  const resend = new Resend(apiKey);
  const text = [
    "Weekly newsletter delivery summary",
    "",
    `Issue date: ${input.issueDate}`,
    `Campaign ID: ${input.campaignId}`,
    `Recipients: ${input.totalRecipients}`,
    `Sent: ${input.sentCount}`,
    `Failed: ${input.failedCount}`,
    `Excluded: ${input.skippedCount}`,
  ].join("\n");
  const { data, error } = await resend.emails.send({
    from: NEWSLETTER_FROM,
    to: [NEWSLETTER_NOTIFICATION_RECIPIENT],
    subject: `Weekly newsletter delivery summary — ${input.issueDate}`,
    text,
    headers: { "Idempotency-Key": `weekly-newsletter-summary/${input.campaignId}` },
    tags: [{ name: "category", value: "weekly-newsletter-summary" }],
  });
  if (error || !data?.id) throw new Error("Weekly newsletter staff summary was not accepted");
  return data.id;
}

export async function deliverLatestWeeklyNewsletter(now = new Date()) {
  const settings = await getWeeklyNewsletterDeliverySettings();
  if (!settings?.deliveryEnabled) return { status: "disabled" as const };
  await updateWeeklyNewsletterDeliverySettings({ lastRunAt: now, lastError: null });

  const issue = await getLatestPublishedWeeklyNewsletterIssue();
  if (!issue) {
    await updateWeeklyNewsletterDeliverySettings({ lastError: "No published bulletin is available for delivery." });
    return { status: "skipped-no-published-issue" as const };
  }

  const campaign = await getOrCreateWeeklyNewsletterCampaign({
    issue,
    subject: campaignSubject(issue.issueDate),
    sender: NEWSLETTER_FROM,
    scheduledFor: now,
  });
  if (["sent", "skipped"].includes(campaign.status)) {
    return { status: "skipped-already-processed" as const, campaign };
  }

  try {
    const recipients = await listActiveNewsletterSubscribers();
    await ensureWeeklyNewsletterCampaignDeliveries(campaign.id, recipients);
    await markWeeklyNewsletterCampaignSending(campaign.id);
    const deliveries = await listWeeklyNewsletterCampaignDeliveries(campaign.id, ["queued", "failed"]);

    for (const delivery of deliveries) {
      if (!(await claimWeeklyNewsletterDelivery(delivery.id))) continue;
      const subscriber = await getNewsletterSubscriberById(delivery.subscriberId);
      if (!subscriber || subscriber.status === "suppressed" || subscriber.isActive === 0 || subscriber.status === "unsubscribed") {
        await markWeeklyNewsletterDeliveryExcluded(delivery.id, subscriber?.status === "suppressed" ? "suppressed" : "unsubscribed");
        continue;
      }

      try {
        const unsubscribe = await createWeeklyNewsletterUnsubscribeToken(subscriber.id);
        const providerEmailId = await sendWeeklyNewsletterEmail(
          buildWeeklyNewsletterEmail({
            email: delivery.email,
            lang: delivery.lang,
            issueDate: issue.issueDate,
            titleKo: issue.titleKo,
            titleEn: issue.titleEn,
            bulletinUrl: issue.storageUrl,
            unsubscribeToken: unsubscribe.token,
          }),
          `weekly-newsletter/${campaign.id}/${subscriber.id}`,
          campaign.id,
          subscriber.id,
        );
        await markWeeklyNewsletterDeliverySent(delivery.id, providerEmailId);
      } catch {
        await markWeeklyNewsletterDeliveryFailed(delivery.id, "Email provider did not accept this bulletin delivery.");
      }
    }

    const updatedCampaign = await refreshWeeklyNewsletterCampaignCounts(campaign.id);
    if (!updatedCampaign) throw new Error("Campaign could not be refreshed after delivery");
    await updateWeeklyNewsletterDeliverySettings({ lastSuccessAt: new Date(), lastError: null });
    try {
      await sendWeeklyNewsletterStaffSummary({
        issueDate: issue.issueDate,
        campaignId: updatedCampaign.id,
        totalRecipients: updatedCampaign.totalRecipients,
        sentCount: updatedCampaign.sentCount,
        failedCount: updatedCampaign.failedCount,
        skippedCount: updatedCampaign.skippedCount,
      });
    } catch {
      console.warn("[weeklyNewsletter.delivery] Staff summary failed after campaign was recorded.");
    }
    return { status: "processed" as const, campaign: updatedCampaign };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown weekly newsletter delivery error";
    await updateWeeklyNewsletterDeliverySettings({ lastError: message.slice(0, 1000) });
    return { status: "failed" as const, campaign, error: message };
  }
}
