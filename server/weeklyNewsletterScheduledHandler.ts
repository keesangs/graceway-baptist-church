import type { Express, Request, Response } from "express";
import { getWeeklyNewsletterSyncSettings } from "./db";
import { sdk } from "./_core/sdk";
import { deliverLatestWeeklyNewsletter } from "./weeklyNewsletterDelivery";
import { syncPublicWeeklyNewsletterArchive } from "./weeklyNewsletterSync";

const WEEKLY_NEWSLETTER_SYNC_PATH = "/api/scheduled/weekly-newsletter-sync";
const CHURCH_TIME_ZONE = "America/Los_Angeles";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown weekly newsletter sync error";
}

/** The heartbeat runs at 16:00 and 17:00 UTC; this keeps the actual work at 9 AM PT across DST. */
export function isSundayMorningNewsletterSyncTime(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHURCH_TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return values.weekday === "Sun" && values.hour === "09";
}

/**
 * Registers a project-owned Heartbeat callback. The task UID from the verified
 * cron identity must match the persisted newsletter schedule, preventing an
 * unrelated scheduled task from publishing a Drive file.
 */
export function registerWeeklyNewsletterScheduledHandler(app: Express) {
  app.post(WEEKLY_NEWSLETTER_SYNC_PATH, async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }

      const settings = await getWeeklyNewsletterSyncSettings();
      if (!settings?.scheduleCronTaskUid || settings.scheduleCronTaskUid !== user.taskUid) {
        return res.status(403).json({ error: "unrecognized-weekly-newsletter-sync-task" });
      }

      if (!isSundayMorningNewsletterSyncTime(new Date())) {
        return res.json({ ok: true, skipped: "outside-sunday-9am-church-time", timestamp: new Date().toISOString() });
      }

      const result = await syncPublicWeeklyNewsletterArchive();
      const delivery = await deliverLatestWeeklyNewsletter();
      return res.json({ ok: true, result, delivery, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = errorMessage(error);
      console.error("[Weekly newsletter sync] scheduled run failed:", error);
      return res.status(500).json({
        error: message,
        context: { path: WEEKLY_NEWSLETTER_SYNC_PATH },
        timestamp: new Date().toISOString(),
      });
    }
  });
}

export { WEEKLY_NEWSLETTER_SYNC_PATH };
