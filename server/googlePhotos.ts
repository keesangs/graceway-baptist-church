import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import {
  consumeGooglePhotosOAuthState,
  createGalleryPhoto,
  createGooglePhotosOAuthState,
  getGalleryPhotoByGooglePhotosSourceItemId,
  getGooglePhotosConnectionForUser,
  saveGooglePhotosConnection,
} from "./db";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

const GOOGLE_PHOTOS_PICKER_SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";
const GOOGLE_OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_PICKER_BASE_URL = "https://photospicker.googleapis.com/v1";
const OAUTH_STATE_TTL_MILLISECONDS = 10 * 60 * 1000;
const MAX_IMPORTED_PHOTOS = 100;
const MAX_IMPORTED_FILE_SIZE = 20 * 1024 * 1024;
const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
type SupportedGooglePhotosMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/avif" | "image/gif";

const filenameMimeTypes: Record<string, SupportedGooglePhotosMimeType> = {
  avif: "image/avif", gif: "image/gif", jpeg: "image/jpeg", jpe: "image/jpeg", jpg: "image/jpeg", png: "image/png", webp: "image/webp",
};

function normalizedMimeType(value?: string | null) {
  const normalized = value?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (normalized === "image/jpg" || normalized === "image/pjpeg") return "image/jpeg";
  if (normalized === "image/x-png") return "image/png";
  if (normalized === "image/x-webp") return "image/webp";
  return normalized;
}

export function resolveGooglePhotosImageMimeType(values: { responseMimeType?: string | null; declaredMimeType?: string | null; filename?: string | null }): SupportedGooglePhotosMimeType | null {
  for (const candidate of [normalizedMimeType(values.responseMimeType), normalizedMimeType(values.declaredMimeType)]) {
    if (supportedMimeTypes.has(candidate)) return candidate as SupportedGooglePhotosMimeType;
  }
  const extension = values.filename?.split(".").pop()?.toLowerCase() ?? "";
  return filenameMimeTypes[extension] ?? null;
}

export function getGooglePhotosFilename(itemId: string, filename?: string | null, mimeType?: string | null) {
  const supplied = filename?.trim();
  if (supplied) return supplied;
  const extension = resolveGooglePhotosImageMimeType({ declaredMimeType: mimeType })?.split("/")[1] ?? "jpg";
  return `google-photo-${itemId}.${extension === "jpeg" ? "jpg" : extension}`;
}

type GoogleTokenResponse = { access_token?: string; refresh_token?: string; scope?: string; error?: string; error_description?: string };
type PickedMediaItem = { id: string; type: "PHOTO" | "VIDEO" | string; mediaFile?: { baseUrl?: string; mimeType?: string; filename?: string } };

function requiredGooglePhotosConfig() {
  if (!ENV.googlePhotosClientId || !ENV.googlePhotosClientSecret) throw new Error("Google Photos OAuth is not configured");
  return { clientId: ENV.googlePhotosClientId, clientSecret: ENV.googlePhotosClientSecret };
}

export function getGooglePhotosRedirectUri() {
  return process.env.GOOGLE_PHOTOS_REDIRECT_URI ?? "https://graceway-baptist.org/api/google-photos/callback";
}

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("Server encryption key is not configured");
  return createHash("sha256").update(`graceway-google-photos:${ENV.cookieSecret}`).digest();
}

export function encryptGooglePhotosRefreshToken(refreshToken: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptGooglePhotosRefreshToken(value: string) {
  const [ivPart, authTagPart, ciphertextPart] = value.split(".");
  if (!ivPart || !authTagPart || !ciphertextPart) throw new Error("Stored Google Photos authorization is invalid");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextPart, "base64url")), decipher.final()]).toString("utf8");
}

export async function beginGooglePhotosAuthorization(userId: number) {
  const { clientId } = requiredGooglePhotosConfig();
  const state = randomUUID();
  await createGooglePhotosOAuthState(state, userId, new Date(Date.now() + OAUTH_STATE_TTL_MILLISECONDS));
  const url = new URL(GOOGLE_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getGooglePhotosRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", `${GOOGLE_PHOTOS_PICKER_SCOPE} openid email`);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return { authorizationUrl: url.toString(), expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MILLISECONDS) };
}

async function requestToken(body: URLSearchParams) {
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const payload = await response.json() as GoogleTokenResponse;
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Google Photos authorization failed");
  return payload;
}

export async function completeGooglePhotosAuthorization(code: string, state: string, userId: number) {
  const csrfState = await consumeGooglePhotosOAuthState(state);
  if (!csrfState || csrfState.userId !== userId) throw new Error("Google Photos authorization request expired or is invalid");
  const { clientId, clientSecret } = requiredGooglePhotosConfig();
  const token = await requestToken(new URLSearchParams({
    code, client_id: clientId, client_secret: clientSecret, redirect_uri: getGooglePhotosRedirectUri(), grant_type: "authorization_code",
  }));
  if (!token.refresh_token) throw new Error("Google did not return an offline access token. Please reconnect Google Photos.");
  return saveGooglePhotosConnection({
    userId,
    googleAccountEmail: null,
    encryptedRefreshToken: encryptGooglePhotosRefreshToken(token.refresh_token),
    scope: token.scope ?? GOOGLE_PHOTOS_PICKER_SCOPE,
  });
}

async function getGooglePhotosAccessToken(userId: number) {
  const connection = await getGooglePhotosConnectionForUser(userId);
  if (!connection) throw new Error("Connect Google Photos before importing images");
  const { clientId, clientSecret } = requiredGooglePhotosConfig();
  const refreshToken = decryptGooglePhotosRefreshToken(connection.encryptedRefreshToken);
  const token = await requestToken(new URLSearchParams({
    client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token",
  }));
  return token.access_token!;
}

async function pickerFetch<T>(url: string, accessToken: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${accessToken}`, ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "Google Photos Picker request failed");
  return payload;
}

export async function createGooglePhotosPickerSession(userId: number) {
  const accessToken = await getGooglePhotosAccessToken(userId);
  const session = await pickerFetch<{ id?: string; pickerUri?: string; pollingConfig?: { pollInterval?: string; timeoutIn?: string } }>(
    `${GOOGLE_PICKER_BASE_URL}/sessions?requestId=${randomUUID()}`,
    accessToken,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
  );
  if (!session.id || !session.pickerUri) throw new Error("Google Photos Picker session could not be created");
  return { sessionId: session.id, pickerUri: session.pickerUri, pollingConfig: session.pollingConfig ?? null };
}

export async function getGooglePhotosPickerSession(userId: number, sessionId: string) {
  const accessToken = await getGooglePhotosAccessToken(userId);
  return pickerFetch<{ id?: string; mediaItemsSet?: boolean; pollingConfig?: { pollInterval?: string; timeoutIn?: string } }>(
    `${GOOGLE_PICKER_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`,
    accessToken,
  );
}

export async function importGooglePhotosSelection(userId: number, albumId: number, sessionId: string) {
  const accessToken = await getGooglePhotosAccessToken(userId);
  const session = await pickerFetch<{ mediaItemsSet?: boolean }>(`${GOOGLE_PICKER_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, accessToken);
  if (!session.mediaItemsSet) throw new Error("Choose photos in Google Photos and select Done before importing");

  const pickedItems: PickedMediaItem[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${GOOGLE_PICKER_BASE_URL}/mediaItems`);
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("pageSize", String(Math.min(100, MAX_IMPORTED_PHOTOS - pickedItems.length)));
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const page = await pickerFetch<{ mediaItems?: PickedMediaItem[]; nextPageToken?: string }>(url.toString(), accessToken);
    pickedItems.push(...(page.mediaItems ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken && pickedItems.length < MAX_IMPORTED_PHOTOS);

  let imported = 0;
  let skipped = 0;
  let unsupported = 0;
  const diagnostics = { nonPhoto: 0, duplicate: 0, downloadFailed: 0, unsupportedFormat: 0, tooLarge: 0 };
  for (const item of pickedItems) {
    const mediaFile = item.mediaFile;
    if (item.type !== "PHOTO" || !mediaFile?.baseUrl) { unsupported += 1; diagnostics.nonPhoto += 1; continue; }
    if (await getGalleryPhotoByGooglePhotosSourceItemId(item.id)) { skipped += 1; diagnostics.duplicate += 1; continue; }
    // Picker media URLs are temporary resources associated with the selected
    // session. Include the same OAuth token used for the Picker API so Google
    // returns image bytes instead of an unauthenticated HTML/error response.
    const source = await fetch(`${mediaFile.baseUrl}=w2048-h2048`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const filename = getGooglePhotosFilename(item.id, mediaFile.filename, mediaFile.mimeType);
    const mimeType = resolveGooglePhotosImageMimeType({
      responseMimeType: source.headers.get("content-type"), declaredMimeType: mediaFile.mimeType, filename,
    });
    const expectedSize = Number(source.headers.get("content-length") ?? 0);
    if (!source.ok) { unsupported += 1; diagnostics.downloadFailed += 1; continue; }
    if (!mimeType) { unsupported += 1; diagnostics.unsupportedFormat += 1; continue; }
    if (expectedSize && expectedSize > MAX_IMPORTED_FILE_SIZE) { unsupported += 1; diagnostics.tooLarge += 1; continue; }
    const buffer = Buffer.from(await source.arrayBuffer());
    if (!buffer.byteLength) { unsupported += 1; diagnostics.downloadFailed += 1; continue; }
    if (buffer.byteLength > MAX_IMPORTED_FILE_SIZE) { unsupported += 1; diagnostics.tooLarge += 1; continue; }
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const { key, url } = await storagePut(`church-gallery/${albumId}/google-${item.id}-${safeFilename}`, buffer, mimeType);
    await createGalleryPhoto({
      albumId, filename, storageKey: key, storageUrl: url, mimeType, fileSize: buffer.byteLength,
      captionKo: null, captionEn: null, altTextKo: null, altTextEn: null, source: "google_photos", sourceItemId: item.id,
      sortOrder: imported, status: "draft", uploadedBy: userId,
    });
    imported += 1;
  }
  return { imported, skipped, unsupported, totalSelected: pickedItems.length, diagnostics };
}
