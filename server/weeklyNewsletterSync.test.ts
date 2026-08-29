import { describe, expect, it } from "vitest";
import {
  fetchPublicDriveWeeklyNewsletters,
  issueDateFromWeeklyNewsletterFilename,
  parsePublicDriveBulletinsHtml,
} from "./weeklyNewsletterSync";

describe("weekly newsletter public Drive parser", () => {
  it("recognizes the church's dated Korean PDF filenames", () => {
    expect(issueDateFromWeeklyNewsletterFilename("2026 0823_주일 주보.pdf")).toBe("2026-08-23");
    expect(issueDateFromWeeklyNewsletterFilename("2026 0229_주일 주보.pdf")).toBeNull();
    expect(issueDateFromWeeklyNewsletterFilename("그레이스포인트 교회 주보 Template.docx")).toBeNull();
  });

  it("keeps dated bulletin PDFs, extracts file IDs, and sorts newest first", () => {
    const html = [
      '<div data-id="olderBulletin_2026" data-tooltip="2026 0816_주일 주보.pdf PDF"></div>',
      '<div data-id="newestBulletin_2026" data-tooltip="2026 0823_주일 주보.pdf PDF"></div>',
      '<div data-id="templateDocument_2026" data-tooltip="그레이스포인트 교회 주보 Template.docx"></div>',
    ].join("\n");

    expect(parsePublicDriveBulletinsHtml(html)).toEqual([
      expect.objectContaining({ driveFileId: "newestBulletin_2026", issueDate: "2026-08-23" }),
      expect.objectContaining({ driveFileId: "olderBulletin_2026", issueDate: "2026-08-16" }),
    ]);
  });

  it("reads the configured public folder and finds the published church bulletin series", async () => {
    const folderId = process.env.GOOGLE_DRIVE_BULLETIN_FOLDER_ID;
    expect(folderId).toBeTruthy();

    const bulletins = await fetchPublicDriveWeeklyNewsletters(folderId!);

    expect(bulletins).toEqual(expect.arrayContaining([
      expect.objectContaining({ issueDate: "2026-08-23", sourceFilename: "2026 0823_주일 주보.pdf" }),
    ]));
    expect(bulletins[0]?.issueDate >= bulletins[1]?.issueDate!).toBe(true);
  }, 15_000);
});
