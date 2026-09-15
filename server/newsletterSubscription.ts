import { createHash, randomBytes } from "node:crypto";

export const NEWSLETTER_PUBLIC_ORIGIN = "https://graceway-baptist.org";
export const NEWSLETTER_TOKEN_TTL_HOURS = 48;
export const NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_DAYS = 365;

export type NewsletterTokenPurpose = "confirm" | "unsubscribe";

export function createNewsletterToken() {
  return randomBytes(32).toString("base64url");
}

export function hashNewsletterToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function getNewsletterTokenExpiry(now = new Date(), purpose: NewsletterTokenPurpose = "confirm") {
  if (purpose === "unsubscribe") {
    return new Date(now.getTime() + NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getTime() + NEWSLETTER_TOKEN_TTL_HOURS * 60 * 60 * 1000);
}

export function buildNewsletterSubscriptionUrl(purpose: NewsletterTokenPurpose, token: string) {
  const path = purpose === "confirm" ? "confirm" : "unsubscribe";
  return `${NEWSLETTER_PUBLIC_ORIGIN}/newsletter/${path}/${encodeURIComponent(token)}`;
}
