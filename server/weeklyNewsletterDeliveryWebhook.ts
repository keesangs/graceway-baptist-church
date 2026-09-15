import type { Express, Request, Response } from "express";
import express from "express";
import { Resend } from "resend";
import { recordWeeklyNewsletterProviderEvent } from "./db";

export const WEEKLY_NEWSLETTER_RESEND_WEBHOOK_PATH = "/api/webhooks/resend";

type ResendWebhookData = {
  email_id?: string;
  tags?: Record<string, string>;
  bounce?: { message?: string };
  complaint?: { message?: string };
};

type ResendWebhookPayload = {
  type: string;
  created_at?: string;
  data?: ResendWebhookData;
};

function requiredHeader(req: Request, name: string) {
  const value = req.header(name);
  return value || "";
}

export function registerWeeklyNewsletterDeliveryWebhook(app: Express) {
  app.post(WEEKLY_NEWSLETTER_RESEND_WEBHOOK_PATH, express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(503).json({ error: "newsletter-webhook-not-configured" });

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const event = resend.webhooks.verify({
        payload: Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "",
        headers: {
          id: requiredHeader(req, "svix-id"),
          timestamp: requiredHeader(req, "svix-timestamp"),
          signature: requiredHeader(req, "svix-signature"),
        },
        webhookSecret,
      }) as ResendWebhookPayload;

      if (event.data?.tags?.category !== "weekly-newsletter") {
        return res.json({ ok: true, ignored: "not-weekly-newsletter" });
      }
      const result = await recordWeeklyNewsletterProviderEvent({
        providerEventId: requiredHeader(req, "svix-id"),
        providerEmailId: event.data?.email_id ?? null,
        eventType: event.type,
        occurredAt: event.created_at ? new Date(event.created_at) : null,
        failureReason: event.data?.bounce?.message ?? event.data?.complaint?.message ?? null,
      });
      return res.json({ ok: true, duplicate: result.duplicate });
    } catch (error) {
      return res.status(400).json({ error: "invalid-newsletter-webhook" });
    }
  });
}
