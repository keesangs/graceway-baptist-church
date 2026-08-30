import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decryptGooglePhotosRefreshToken, encryptGooglePhotosRefreshToken, getGooglePhotosFilename, getGooglePhotosRedirectUri, resolveGooglePhotosImageMimeType } from "./googlePhotos";

const googlePhotosModule = readFileSync(new URL("./googlePhotos.ts", import.meta.url), "utf8");
const googlePhotosRoutes = readFileSync(new URL("./googlePhotosRoutes.ts", import.meta.url), "utf8");
const googlePhotosRouter = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const adminGalleryPanel = readFileSync(new URL("../client/src/components/AdminGalleryPanel.tsx", import.meta.url), "utf8");

describe("Google Photos Picker import", () => {
  it("encrypts a refresh token before persistence and can decrypt it only on the server", () => {
    const refreshToken = "test-refresh-token-for-encryption-check";
    const encrypted = encryptGooglePhotosRefreshToken(refreshToken);

    expect(encrypted).not.toContain(refreshToken);
    expect(encrypted.split(".")).toHaveLength(3);
    expect(decryptGooglePhotosRefreshToken(encrypted)).toBe(refreshToken);
  });

  it("uses the approved OAuth callback URL and one-time state records", () => {
    expect(getGooglePhotosRedirectUri()).toBe("https://graceway-baptist.org/api/google-photos/callback");
    expect(googlePhotosModule).toContain("createGooglePhotosOAuthState");
    expect(googlePhotosModule).toContain("consumeGooglePhotosOAuthState");
    expect(googlePhotosRoutes).toContain('app.get("/api/google-photos/callback"');
    expect(googlePhotosRoutes).toContain('user.role !== "admin"');
  });

  it("imports only administrator-selected photos, requires completion, and keeps imported images as drafts", () => {
    expect(googlePhotosModule).toContain("session.mediaItemsSet");
    expect(googlePhotosModule).toContain("item.type !== \"PHOTO\"");
    expect(googlePhotosModule).toContain("getGalleryPhotoByGooglePhotosSourceItemId");
    expect(googlePhotosModule).toContain("source: \"google_photos\"");
    expect(googlePhotosModule).toContain('status: "draft"');
    expect(googlePhotosModule).toContain("=w2048-h2048");
    expect(googlePhotosModule).toMatch(/const source = await fetch\([\s\S]*Authorization: `Bearer \$\{accessToken\}`/);
    expect(googlePhotosModule).toContain("MAX_IMPORTED_FILE_SIZE");
    expect(googlePhotosModule).toContain("diagnostics = { nonPhoto: 0, duplicate: 0, downloadFailed: 0, unsupportedFormat: 0, tooLarge: 0 }");
  });

  it("accepts standard Picker image MIME aliases and photos without an original filename", () => {
    expect(resolveGooglePhotosImageMimeType({ responseMimeType: "image/jpg; charset=binary" })).toBe("image/jpeg");
    expect(resolveGooglePhotosImageMimeType({ declaredMimeType: "image/x-png" })).toBe("image/png");
    expect(resolveGooglePhotosImageMimeType({ filename: "church-gathering.webp" })).toBe("image/webp");
    expect(resolveGooglePhotosImageMimeType({ declaredMimeType: "image/gif" })).toBe("image/gif");
    expect(getGooglePhotosFilename("selected-photo-1", undefined, "image/jpeg")).toBe("google-photo-selected-photo-1.jpg");
  });

  it("exposes the authorization, picker session, and selected import flow only to admins", () => {
    expect(googlePhotosRouter).toContain("googlePhotos: router");
    expect(googlePhotosRouter).toContain("beginAuthorization: adminProcedure");
    expect(googlePhotosRouter).toContain("createPickerSession: adminProcedure");
    expect(googlePhotosRouter).toContain("importSelection: adminProcedure");
    expect(adminGalleryPanel).toContain("Google Photos에서 가져오기");
    expect(adminGalleryPanel).toContain("사진 선택");
    expect(adminGalleryPanel).toContain("선택한 사진 가져오기");
    expect(adminGalleryPanel).toContain("전체 앨범은 자동으로 동기화하지 않습니다.");
    expect(adminGalleryPanel).toContain("처리하지 못한 항목:");
  });
});
