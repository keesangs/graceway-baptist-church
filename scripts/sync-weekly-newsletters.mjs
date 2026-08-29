import { syncPublicWeeklyNewsletterArchive } from "../server/weeklyNewsletterSync.ts";

try {
  const result = await syncPublicWeeklyNewsletterArchive();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
