import type { Express, Request, Response } from "express";
import { getWeeklyNewsletterDeliverySettings } from "./db";
import { sdk } from "./_core/sdk";
import { deliverLatestWeeklyNewsletter } from "./weeklyNewsletterDelivery";
import { isSundayMorningNewsletterSyncTime } from "./weeklyNewsletterScheduledHandler";

export const WEEKLY_NEWSLETTER_DELIVERY_PATH = "/api/scheduled/weekly-newsletter-delivery";

export function registerWeeklyNewsletterDeliveryScheduledHandler(app: Express) {
  app.post(WEEKLY_NEWSLETTER_DELIVERY_PATH, async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });

      const settings = await getWeeklyNewsletterDeliverySettings();
      if (!settings?.scheduleCronTaskUid || settings.scheduleCronTaskUid !== user.taskUid) {
        return res.status(403).json({ error: "unrecognized-weekly-newsletter-delivery-task" });
      }
      if (!isSundayMorningNewsletterSyncTime(new Date())) {
        return res.json({ ok: true, skipped: "outside-sunday-9am-church-time", timestamp: new Date().toISOString() });
      }

      const result = await deliverLatestWeeklyNewsletter();
      if (result.status === "failed") {
        return res.status(500).json({ error: result.error, context: { path: WEEKLY_NEWSLETTER_DELIVERY_PATH }, timestamp: new Date().toISOString() });
      }
      return res.json({ ok: true, result, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown weekly newsletter delivery error";
      return res.status(500).json({ error: message, context: { path: WEEKLY_NEWSLETTER_DELIVERY_PATH }, timestamp: new Date().toISOString() });
    }
  });
}
