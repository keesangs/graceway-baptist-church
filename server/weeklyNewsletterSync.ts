import {
  createWeeklyNewsletterIssue,
  getWeeklyNewsletterIssueByDriveFileId,
  getWeeklyNewsletterIssueByIssueDate,
  updateWeeklyNewsletterIssue,
  updateWeeklyNewsletterSyncSettings,
} from "./db";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

const PUBLIC_DRIVE_BASE_URL = "https://drive.google.com/drive/folders";
const PUBLIC_DRIVE_DOWNLOAD_URL = "https://drive.usercontent.google.com/download";
const MAX_BULLETIN_BYTES = 20 * 1024 * 1024;
const BULLETIN_ARCHIVE_LIMIT = 100;

export type PublicDriveBulletin = {
  driveFileId: string;
  sourceFilename: string;
  issueDate: string;
  downloadUrl: string;
};

export type WeeklyNewsletterSyncResult = {
  added: number;
  updated: number;
  unchanged: number;
  scanned: number;
  latestIssueDate: string | null;
};

function normalizeFilename(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+PDF$/i, "").trim();
}

/** Extract the Sunday date from the church's existing `2026 0823_주일 주보.pdf` naming convention. */
export function issueDateFromWeeklyNewsletterFilename(filename: string): string | null {
  const match = normalizeFilename(filename).match(/(?:^|\D)(20\d{2})[\s._-]?(\d{2})(\d{2})\s*[_-]?\s*주일\s*주보(?:\s*\([^)]*\))?\.pdf$/i);
  if (!match) return null;

  const [, year, month, day] = match;
  const candidate = `${year}-${month}-${day}`;
  const parsed = new Date(`${candidate}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate ? null : candidate;
}

/**
 * The public folder page contains stable Drive file IDs in `data-id` and names
 * in `data-tooltip`. This parser deliberately accepts only church newsletter
 * PDFs and ignores folders, templates, and unrelated files.
 */
export function parsePublicDriveBulletinsHtml(html: string): PublicDriveBulletin[] {
  const candidates = new Map<string, PublicDriveBulletin>();
  const filePattern = /data-id="([A-Za-z0-9_-]{10,})"[\s\S]{0,700}?data-tooltip="([^"]+?\.pdf)(?:\s+PDF)?"/gi;

  for (const match of Array.from(html.matchAll(filePattern))) {
    const driveFileId = match[1];
    const sourceFilename = normalizeFilename(match[2]);
    const issueDate = issueDateFromWeeklyNewsletterFilename(sourceFilename);
    if (!driveFileId || !issueDate) continue;

    const downloadUrl = new URL(PUBLIC_DRIVE_DOWNLOAD_URL);
    downloadUrl.searchParams.set("id", driveFileId);
    downloadUrl.searchParams.set("export", "download");
    downloadUrl.searchParams.set("confirm", "t");

    candidates.set(driveFileId, {
      driveFileId,
      sourceFilename,
      issueDate,
      downloadUrl: downloadUrl.toString(),
    });
  }

  return Array.from(candidates.values()).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

export async function fetchPublicDriveWeeklyNewsletters(folderId: string): Promise<PublicDriveBulletin[]> {
  if (!/^[A-Za-z0-9_-]{10,}$/.test(folderId)) {
    throw new Error("Google Drive bulletin folder ID is invalid");
  }

  const response = await fetch(`${PUBLIC_DRIVE_BASE_URL}/${folderId}`);
  if (!response.ok) throw new Error(`Public Google Drive folder request failed (${response.status})`);

  return parsePublicDriveBulletinsHtml(await response.text());
}

function cleanStorageFilename(filename: string): string {
  const clean = filename.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_");
  return clean.replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "weekly-newsletter.pdf";
}

async function downloadPublicDrivePdf(bulletin: PublicDriveBulletin): Promise<Buffer> {
  const response = await fetch(bulletin.downloadUrl);
  if (!response.ok) throw new Error(`Weekly newsletter download failed (${response.status})`);

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BULLETIN_BYTES) throw new Error("Weekly newsletter exceeds the 20 MB limit");

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_BULLETIN_BYTES) {
    throw new Error("Weekly newsletter file is empty or exceeds the 20 MB limit");
  }
  if (!buffer.subarray(0, 5).toString("ascii").startsWith("%PDF-")) {
    throw new Error("Weekly newsletter source is not a valid PDF");
  }
  return buffer;
}

async function syncOneWeeklyNewsletter(bulletin: PublicDriveBulletin): Promise<"added" | "updated" | "unchanged"> {
  const byDriveFile = await getWeeklyNewsletterIssueByDriveFileId(bulletin.driveFileId);
  if (byDriveFile) return "unchanged";

  const pdf = await downloadPublicDrivePdf(bulletin);
  const storage = await storagePut(
    `weekly-newsletters/${bulletin.issueDate}_${cleanStorageFilename(bulletin.sourceFilename)}`,
    pdf,
    "application/pdf",
  );
  const now = new Date();
  const data = {
    issueDate: bulletin.issueDate,
    titleKo: `${bulletin.issueDate.replace(/-/g, ".")} 주보`,
    titleEn: `Weekly Newsletter · ${bulletin.issueDate}`,
    sourceFilename: bulletin.sourceFilename,
    driveFileId: bulletin.driveFileId,
    sourceModifiedAt: null,
    storageKey: storage.key,
    storageUrl: storage.url,
    fileSize: pdf.length,
    status: "published" as const,
    publishedAt: now,
    syncedAt: now,
    createdBy: null,
  };

  const existingForIssueDate = await getWeeklyNewsletterIssueByIssueDate(bulletin.issueDate);
  if (existingForIssueDate) {
    await updateWeeklyNewsletterIssue(existingForIssueDate.id, data);
    return "updated";
  }

  await createWeeklyNewsletterIssue(data);
  return "added";
}

/**
 * Import at most the most recent 12 public weekly newsletters. The method is
 * idempotent, so it safely runs on Sunday and via an administrator retry.
 */
export async function syncPublicWeeklyNewsletterArchive(): Promise<WeeklyNewsletterSyncResult> {
  const folderId = ENV.googleDriveBulletinFolderId;
  if (!folderId) throw new Error("Google Drive bulletin folder is not configured");

  const startedAt = new Date();
  await updateWeeklyNewsletterSyncSettings({ lastRunAt: startedAt, lastError: null });

  try {
    const candidates = (await fetchPublicDriveWeeklyNewsletters(folderId)).slice(0, BULLETIN_ARCHIVE_LIMIT);
    let added = 0;
    let updated = 0;
    let unchanged = 0;

    for (const candidate of candidates) {
      const result = await syncOneWeeklyNewsletter(candidate);
      if (result === "added") added += 1;
      if (result === "updated") updated += 1;
      if (result === "unchanged") unchanged += 1;
    }

    await updateWeeklyNewsletterSyncSettings({ lastSuccessAt: new Date(), lastError: null });
    return {
      added,
      updated,
      unchanged,
      scanned: candidates.length,
      latestIssueDate: candidates[0]?.issueDate ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown weekly newsletter sync error";
    await updateWeeklyNewsletterSyncSettings({ lastError: message });
    throw error;
  }
}
