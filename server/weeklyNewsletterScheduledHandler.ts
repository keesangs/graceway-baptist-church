import type { Express, Request, Response } from "express";
import { getWeeklyNewsletterSyncSettings } from "./db";
import { sdk } from "./_core/sdk";
import { syncPublicWeeklyNewsletterArchive } from "./weeklyNewsletterSync";

const WEEKLY_NEWSLETTER_SYNC_PATH = "/api/scheduled/weekly-newsletter-sync";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown weekly newsletter sync error";
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

      const result = await syncPublicWeeklyNewsletterArchive();
      return res.json({ ok: true, result, timestamp: new Date().toISOString() });
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
