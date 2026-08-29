import { describe, expect, it } from "vitest";

const folderId = process.env.GOOGLE_DRIVE_BULLETIN_FOLDER_ID;

describe("public Google Drive bulletin folder configuration", () => {
  it("reaches the configured public weekly newsletter folder", async () => {
    expect(folderId).toBeTruthy();

    const response = await fetch(`https://drive.google.com/drive/folders/${folderId}`);
    const html = await response.text();

    expect(response.ok).toBe(true);
    expect(html).toContain(folderId);
    expect(html).toContain("주일 주보");
  }, 15_000);
});
