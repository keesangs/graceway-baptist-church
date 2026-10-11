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
  listPublishedCalendarEvents,
} from "./db";
import { buildNewsletterSubscriptionUrl, NEWSLETTER_PUBLIC_ORIGIN } from "./newsletterSubscription";
import { NEWSLETTER_FROM, NEWSLETTER_NOTIFICATION_RECIPIENT } from "./newsletterSubscriptionEmail";
import { getFeaturedSpecialCalendarEventOccurrence, getUpcomingCalendarEventOccurrences } from "./eventOccurrences";

const CHURCH_TIME_ZONE = "America/Los_Angeles";
const NEWSLETTER_BRAND_LOGO_URL = `${NEWSLETTER_PUBLIC_ORIGIN}/manus-storage/graceway-logo-dark-updated_bda9aced.png`;
const CHURCH_ADDRESS = "2791 Driscoll Rd, Fremont, CA 94539";
const CHURCH_EMAIL = "info@graceway-baptist.org";
const CHURCH_SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/people/Graceway-Baptist-Church/61594452553986/",
  instagram: "https://www.instagram.com/gracewaybaptistchurchfremont",
  youtube: "https://www.youtube.com/@Graceway-Baptist",
} as const;

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

function buildNewsletterHttpsUrl(storedUrl: string | null | undefined, fallbackPath: string) {
  const candidate = storedUrl?.trim() || fallbackPath;
  try {
    const resolved = new URL(candidate, NEWSLETTER_PUBLIC_ORIGIN);
    return resolved.protocol === "https:" ? resolved.toString() : new URL(fallbackPath, NEWSLETTER_PUBLIC_ORIGIN).toString();
  } catch {
    return new URL(fallbackPath, NEWSLETTER_PUBLIC_ORIGIN).toString();
  }
}

function socialIconLink(href: string, label: string, icon: string, color: string) {
  return `<a href="${escapeHtml(href)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" style="display:inline-block;width:30px;height:30px;margin-right:8px;border-radius:50%;background:${color};color:#fff;text-align:center;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:700;line-height:30px;vertical-align:middle">${icon}<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">${escapeHtml(label)}</span></a>`;
}

export function buildWeeklyNewsletterBulletinUrl(storedUrl: string) {
  const candidate = storedUrl.trim();
  const resolved = new URL(candidate || "/events", NEWSLETTER_PUBLIC_ORIGIN);

  // The bulletin archive stores site-local paths such as /manus-storage/….
  // Email clients require a complete HTTPS URL and must never receive http:///….
  if (resolved.origin === NEWSLETTER_PUBLIC_ORIGIN) return resolved.toString();
  return resolved.protocol === "https:" ? resolved.toString() : new URL("/events", NEWSLETTER_PUBLIC_ORIGIN).toString();
}

export function buildWeeklyNewsletterEmail(input: {
  email: string;
  lang: "ko" | "en";
  issueDate: string;
  titleKo: string;
  titleEn: string | null;
  bulletinUrl: string;
  unsubscribeToken: string;
  highlight?: {
    titleKo: string;
    titleEn: string | null;
    descriptionKo: string | null;
    descriptionEn: string | null;
    date: string;
    imageUrl: string | null;
    href: string;
  };
}) {
  const ko = input.lang === "ko";
  const title = (ko ? input.titleKo : input.titleEn) || input.titleKo;
  const date = bulletinDate(input.issueDate, input.lang);
  const unsubscribeUrl = buildNewsletterSubscriptionUrl("unsubscribe", input.unsubscribeToken);
  const bulletinUrl = buildWeeklyNewsletterBulletinUrl(input.bulletinUrl);
  const heading = ko ? "이번 주 교회 주보" : "This Week's Church Bulletin";
  const intro = ko
    ? "그레이스웨이 침례교회의 이번 주 주보와 주요 안내를 확인해 주세요."
    : "Please review this week's Graceway Baptist Church bulletin and important announcements.";
  const viewLabel = ko ? "주보 보기" : "View bulletin";
  const downloadLabel = ko ? "PDF 다운로드" : "Download PDF";
  const unsubscribeLabel = ko ? "뉴스레터 구독 취소" : "Unsubscribe";
  const bannerLabel = ko ? "그레이스웨이 주간 주보" : "Graceway Weekly Newsletter";
  const churchName = "Graceway Baptist Church · 그레이스웨이 침례교회";
  const footerHeading = ko ? "그레이스웨이 침례교회" : "Graceway Baptist Church";
  const footerAddressLabel = "Address";
  const footerServiceLabel = ko ? "예배 시간 / Service times" : "Service times / 예배 시간";
  const footerSocialLabel = ko ? "소셜 미디어" : "Social media";
  const footerContactLabel = ko ? "문의" : "Contact";
  const footerSunday = ko ? "주일 예배 · 오후 1:30" : "Sunday worship · 1:30 PM";
  const footerWednesday = ko ? "수요 기도회 · 오후 8:00" : "Wednesday prayer · 8:00 PM";
  const footerFacebook = ko ? "페이스북" : "Facebook";
  const footerInstagram = ko ? "인스타그램" : "Instagram";
  const footerYoutube = ko ? "유튜브" : "YouTube";
  const highlightTitle = input.highlight ? ((ko ? input.highlight.titleKo : input.highlight.titleEn) || input.highlight.titleKo) : null;
  const highlightDescription = input.highlight
    ? ((ko ? input.highlight.descriptionKo : input.highlight.descriptionEn) || (ko ? "다가오는 교회 행사와 소식을 확인해 주세요." : "See what is happening next at Graceway."))
    : null;
  const highlightDate = input.highlight ? bulletinDate(input.highlight.date.slice(0, 10), input.lang) : null;
  const highlightImageUrl = buildNewsletterHttpsUrl(input.highlight?.imageUrl, "/manus-storage/graceway-logo-dark-updated_bda9aced.png");
  const highlightHref = buildNewsletterHttpsUrl(input.highlight?.href, "/events");
  const highlightHeading = ko ? "다가오는 교회 행사" : "Upcoming at Graceway";
  const highlightDateLabel = ko ? "일정" : "Date";
  const highlightLinkLabel = ko ? "행사 자세히 보기" : "View event details";

  return {
    from: NEWSLETTER_FROM,
    to: [input.email],
    replyTo: NEWSLETTER_NOTIFICATION_RECIPIENT,
    subject: ko ? `그레이스웨이 주간 주보 — ${date}` : `Graceway Weekly Bulletin — ${date}`,
    text: [
      churchName,
      bannerLabel,
      "",
      heading,
      title,
      intro,
      ...(input.highlight ? ["", highlightHeading, highlightTitle ?? "", `${highlightDateLabel}: ${highlightDate}`, highlightDescription ?? "", highlightHref] : []),
      "",
      `${viewLabel}: ${bulletinUrl}`,
      `${downloadLabel}: ${bulletinUrl}`,
      "",
      footerHeading,
      `Address: ${CHURCH_ADDRESS}`,
      `예배 시간 / Service times: ${footerSunday} · ${footerWednesday}`,
      `${footerContactLabel}: ${CHURCH_EMAIL}`,
      `${footerSocialLabel}: ${footerFacebook} ${CHURCH_SOCIAL_LINKS.facebook} · ${footerInstagram} ${CHURCH_SOCIAL_LINKS.instagram} · ${footerYoutube} ${CHURCH_SOCIAL_LINKS.youtube}`,
      "",
      `${unsubscribeLabel}: ${unsubscribeUrl}`,
    ].join("\n"),
    html: [
      '<div style="max-width:620px;margin:0 auto;background:#FFFEFB;font-family:Arial,sans-serif;color:#242A30;line-height:1.6">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#17324D">',
      '<tr><td align="center" style="padding:26px 24px 18px">',
      `<img src="${NEWSLETTER_BRAND_LOGO_URL}" width="300" alt="${escapeHtml(churchName)}" style="display:block;width:300px;max-width:100%;height:auto;border:0">`,
      '</td></tr>',
      `<tr><td align="center" style="padding:0 24px 24px;color:#E5C484;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase">${escapeHtml(bannerLabel)}</td></tr>`,
      '</table>',
      '<div style="padding:30px 24px 24px">',
      `<h1 style="color:#17324D;font-family:Georgia,serif">${escapeHtml(heading)}</h1>`,
      `<p style="font-size:18px;font-weight:700;color:#17324D">${escapeHtml(title)}</p>`,
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${escapeHtml(bulletinUrl)}" style="display:inline-block;background:#17324D;color:#fff;padding:12px 18px;text-decoration:none">${escapeHtml(viewLabel)}</a></p>`,
      `<p><a href="${escapeHtml(bulletinUrl)}" style="color:#2F6F9F">${escapeHtml(downloadLabel)}</a></p>`,
      ...(input.highlight ? [
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:28px;background:#F4F6F7">',
        `<tr><td><img src="${escapeHtml(highlightImageUrl)}" width="572" alt="${escapeHtml(highlightTitle ?? highlightHeading)}" style="display:block;width:100%;max-width:572px;height:auto;border:0"></td></tr>`,
        '<tr><td style="padding:20px 20px 22px">',
        `<p style="margin:0;color:#B07834;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase">${escapeHtml(highlightHeading)}</p>`,
        `<h2 style="margin:6px 0 4px;color:#17324D;font-family:Georgia,serif;font-size:22px">${escapeHtml(highlightTitle ?? "")}</h2>`,
        `<p style="margin:0 0 8px;color:#607A91;font-size:12px"><strong style="color:#17324D">${escapeHtml(highlightDateLabel)}:</strong> ${escapeHtml(highlightDate ?? "")}</p>`,
        `<p style="margin:0 0 14px;color:#242A30;font-size:14px">${escapeHtml(highlightDescription ?? "")}</p>`,
        `<a href="${escapeHtml(highlightHref)}" style="color:#2F6F9F;font-size:13px;font-weight:700;text-decoration:none">${escapeHtml(highlightLinkLabel)} →</a>`,
        '</td></tr></table>',
      ] : []),
      '<hr style="border:0;border-top:1px solid #e2e8ea;margin:28px 0">',
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;color:#607A91;font-size:12px;line-height:1.7">`,
      `<tr><td style="padding-bottom:6px;color:#17324D;font-family:Georgia,serif;font-size:16px;font-weight:700">${escapeHtml(footerHeading)}</td></tr>`,
      `<tr><td><strong style="color:#17324D">${escapeHtml(footerAddressLabel)}:</strong> ${escapeHtml(CHURCH_ADDRESS)}</td></tr>`,
      `<tr><td><strong style="color:#17324D">${escapeHtml(footerServiceLabel)}:</strong> ${escapeHtml(footerSunday)}<br>${escapeHtml(footerWednesday)}</td></tr>`,
      `<tr><td><strong style="color:#17324D">${escapeHtml(footerContactLabel)}:</strong> <a href="mailto:${CHURCH_EMAIL}" style="color:#2F6F9F">${CHURCH_EMAIL}</a></td></tr>`,
      `<tr><td style="padding-top:10px"><strong style="display:block;padding-bottom:6px;color:#17324D">${escapeHtml(footerSocialLabel)}:</strong>${socialIconLink(CHURCH_SOCIAL_LINKS.facebook, footerFacebook, "f", "#1877F2")}${socialIconLink(CHURCH_SOCIAL_LINKS.instagram, footerInstagram, "◎", "#E4405F")}${socialIconLink(CHURCH_SOCIAL_LINKS.youtube, footerYoutube, "▶", "#FF0000")}</td></tr>`,
      '</table>',
      `<p style="font-size:12px;color:#607A91"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#607A91">${escapeHtml(unsubscribeLabel)}</a></p>`,
      '</div>',
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
    const publishedEvents = await listPublishedCalendarEvents();
    const featuredEvent = getFeaturedSpecialCalendarEventOccurrence(publishedEvents, now)
      ?? getUpcomingCalendarEventOccurrences(publishedEvents, now, 1)[0]
      ?? null;
    const newsletterHighlight = featuredEvent ? {
      titleKo: featuredEvent.titleKo,
      titleEn: featuredEvent.titleEn,
      descriptionKo: featuredEvent.descriptionKo,
      descriptionEn: featuredEvent.descriptionEn,
      date: featuredEvent.occurrenceStart.toISOString(),
      imageUrl: featuredEvent.featuredImageUrl,
      href: `/events?event=${featuredEvent.seriesId}`,
    } : undefined;
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
            highlight: newsletterHighlight,
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
