import { and, asc, count, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  calendarEvents,
  CalendarEvent,
  contactMessages,
  dailyMeditations,
  InsertCalendarEvent,
  InsertContactMessage,
  InsertDailyMeditation,
  InsertGalleryPhoto,
  InsertGooglePhotosConnection,
  InsertMediaFile,
  InsertMeditationComment,
  InsertMeditationNote,
  InsertNewsletterSubscriber,
  newsletterSubscriptionTokens,
  InsertPhotoAlbum,
  InsertWeeklyNewsletterIssue,
  InsertUser,
  InsertYouTubeVideo,
  galleryPhotos,
  googlePhotosConnections,
  googlePhotosOAuthStates,
  mediaFiles,
  meditationCommentLikes,
  meditationComments,
  meditationLikes,
  meditationNotes,
  newsletterSubscribers,
  photoAlbums,
  users,
  weeklyNewsletterIssues,
  weeklyNewsletterSyncSettings,
  youtubeVideos,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { createNewsletterToken, getNewsletterTokenExpiry, hashNewsletterToken, type NewsletterTokenPurpose } from "./newsletterSubscription";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ── Media Files ──────────────────────────────────────────────────────────────

export async function insertMediaFile(data: InsertMediaFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(mediaFiles).values(data);
  return result;
}

export async function listMediaFiles(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category && category !== "all") {
    return db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.category, category as any))
      .orderBy(desc(mediaFiles.createdAt));
  }
  return db.select().from(mediaFiles).orderBy(desc(mediaFiles.createdAt));
}

export async function deleteMediaFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
}

// ── YouTube Playlist Videos ──────────────────────────────────────────────────

export type YouTubeVideoKind = "sermon" | "worship";

export async function listYouTubeVideos(videoKind: YouTubeVideoKind) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(youtubeVideos)
    .where(eq(youtubeVideos.videoKind, videoKind))
    // Playlist position is the church-curated newest-first source of truth.
    // Video upload timestamps can differ from the Sunday sermon date.
    .orderBy(asc(youtubeVideos.playlistPosition), desc(youtubeVideos.publishedAt));
}

/**
 * Inserts playlist videos once and refreshes source metadata on later manual
 * syncs. The unique video-kind key prevents duplicate public cards.
 */
export async function saveYouTubePlaylistVideos(videos: InsertYouTubeVideo[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let added = 0;
  let updated = 0;
  const syncTime = new Date();

  for (const video of videos) {
    const [existing] = await db
      .select({ id: youtubeVideos.id })
      .from(youtubeVideos)
      .where(and(eq(youtubeVideos.videoKind, video.videoKind), eq(youtubeVideos.videoId, video.videoId)))
      .limit(1);

    if (existing) {
      await db
        .update(youtubeVideos)
        .set({
          playlistItemId: video.playlistItemId,
          title: video.title,
          speaker: video.speaker ?? null,
          scripture: video.scripture ?? null,
          publishedAt: video.publishedAt,
          thumbnailUrl: video.thumbnailUrl,
          playlistPosition: video.playlistPosition,
          lastSyncedAt: syncTime,
        })
        .where(eq(youtubeVideos.id, existing.id));
      updated += 1;
    } else {
      await db.insert(youtubeVideos).values({ ...video, lastSyncedAt: syncTime });
      added += 1;
    }
  }

  return { added, updated, total: videos.length };
}

export type NewsletterSubscriberStatus = "pending" | "active" | "unsubscribed" | "suppressed";
export type NewsletterSubscriptionRequest = {
  email: string;
  lang: "en" | "ko";
};
export type NewsletterSubscriptionRequestResult = {
  subscriber: typeof newsletterSubscribers.$inferSelect;
  status: "confirmation-required" | "already-active" | "suppressed";
  confirmationToken: string | null;
  confirmationTokenHash: string | null;
};

async function getNewsletterSubscriberByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  const [row] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);
  return row ?? null;
}

async function createNewsletterTokenForSubscriber(subscriberId: number, purpose: NewsletterTokenPurpose) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const token = createNewsletterToken();
  const tokenHash = hashNewsletterToken(token);

  // A newer request supersedes any previously unused token for the same action.
  await db
    .update(newsletterSubscriptionTokens)
    .set({ usedAt: now })
    .where(and(
      eq(newsletterSubscriptionTokens.subscriberId, subscriberId),
      eq(newsletterSubscriptionTokens.purpose, purpose),
      isNull(newsletterSubscriptionTokens.usedAt),
    ));

  await db.insert(newsletterSubscriptionTokens).values({
    subscriberId,
    purpose,
    tokenHash,
    expiresAt: getNewsletterTokenExpiry(now, purpose),
  });

  return { token, tokenHash };
}

/**
 * A public signup never silently reactivates a prior unsubscribe. New and
 * returning recipients must confirm a fresh one-time email link first.
 */
export async function requestNewsletterSubscription(data: NewsletterSubscriptionRequest): Promise<NewsletterSubscriptionRequestResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  let subscriber = await getNewsletterSubscriberByEmail(data.email);

  if (subscriber?.status === "active") {
    return { subscriber, status: "already-active", confirmationToken: null, confirmationTokenHash: null };
  }

  if (subscriber?.status === "suppressed") {
    return { subscriber, status: "suppressed", confirmationToken: null, confirmationTokenHash: null };
  }

  if (subscriber) {
    await db.update(newsletterSubscribers).set({
      lang: data.lang,
      status: "pending",
      isActive: 0,
      confirmedAt: null,
      lastRequestAt: now,
    }).where(eq(newsletterSubscribers.id, subscriber.id));
  } else {
    const [result] = await db.insert(newsletterSubscribers).values({
      email: data.email,
      lang: data.lang,
      status: "pending",
      isActive: 0,
      lastRequestAt: now,
    });
    subscriber = (await getNewsletterSubscriberByEmail(data.email)) ?? null;
    if (!subscriber || !result.insertId) throw new Error("Newsletter subscription record could not be created");
  }

  const refreshed = await getNewsletterSubscriberByEmail(data.email);
  if (!refreshed) throw new Error("Newsletter subscription record could not be loaded");
  const token = await createNewsletterTokenForSubscriber(refreshed.id, "confirm");
  return { subscriber: refreshed, status: "confirmation-required", confirmationToken: token.token, confirmationTokenHash: token.tokenHash };
}

async function findUsableNewsletterToken(rawToken: string, purpose: NewsletterTokenPurpose) {
  const db = await getDb();
  if (!db) return null;
  const [token] = await db.select().from(newsletterSubscriptionTokens).where(and(
    eq(newsletterSubscriptionTokens.tokenHash, hashNewsletterToken(rawToken)),
    eq(newsletterSubscriptionTokens.purpose, purpose),
    isNull(newsletterSubscriptionTokens.usedAt),
    gt(newsletterSubscriptionTokens.expiresAt, new Date()),
  )).limit(1);
  return token ?? null;
}

export async function confirmNewsletterSubscription(rawToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const token = await findUsableNewsletterToken(rawToken, "confirm");
  if (!token) return null;

  const subscriber = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, token.subscriberId)).limit(1);
  if (!subscriber[0] || subscriber[0].status === "suppressed") return null;

  const now = new Date();
  await db.update(newsletterSubscriptionTokens).set({ usedAt: now }).where(eq(newsletterSubscriptionTokens.id, token.id));
  await db.update(newsletterSubscribers).set({ status: "active", isActive: 1, confirmedAt: now, unsubscribedAt: null }).where(eq(newsletterSubscribers.id, token.subscriberId));
  const unsubscribe = await createNewsletterTokenForSubscriber(token.subscriberId, "unsubscribe");
  const [updated] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, token.subscriberId)).limit(1);
  return updated ? { subscriber: updated, unsubscribeToken: unsubscribe.token, unsubscribeTokenHash: unsubscribe.tokenHash } : null;
}

export async function unsubscribeNewsletterSubscriber(rawToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const token = await findUsableNewsletterToken(rawToken, "unsubscribe");
  if (!token) return null;

  const now = new Date();
  await db.update(newsletterSubscriptionTokens).set({ usedAt: now }).where(eq(newsletterSubscriptionTokens.id, token.id));
  await db.update(newsletterSubscribers).set({ status: "unsubscribed", isActive: 0, unsubscribedAt: now }).where(eq(newsletterSubscribers.id, token.subscriberId));
  const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, token.subscriberId)).limit(1);
  return subscriber ?? null;
}

export async function subscribeToNewsletter(data: InsertNewsletterSubscriber) {
  // Deprecated compatibility wrapper. New public callers must use requestNewsletterSubscription.
  return requestNewsletterSubscription({ email: data.email, lang: data.lang ?? "en" });
}

export async function listNewsletterSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.lastRequestAt), desc(newsletterSubscribers.createdAt));
}

// ── Weekly Newsletter Issues ─────────────────────────────────────────────────

export type WeeklyNewsletterStatus = "draft" | "published" | "hidden";

export async function listPublishedWeeklyNewsletterIssues(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(weeklyNewsletterIssues)
    .where(eq(weeklyNewsletterIssues.status, "published"))
    .orderBy(desc(weeklyNewsletterIssues.issueDate))
    .limit(limit);
}

export async function getLatestPublishedWeeklyNewsletterIssue() {
  const issues = await listPublishedWeeklyNewsletterIssues(1);
  return issues[0] ?? null;
}

export async function listWeeklyNewsletterIssuesForAdmin(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklyNewsletterIssues).orderBy(desc(weeklyNewsletterIssues.issueDate)).limit(limit);
}

export async function getWeeklyNewsletterIssueById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [issue] = await db.select().from(weeklyNewsletterIssues).where(eq(weeklyNewsletterIssues.id, id)).limit(1);
  return issue ?? null;
}

export async function getWeeklyNewsletterIssueByDriveFileId(driveFileId: string) {
  const db = await getDb();
  if (!db) return null;
  const [issue] = await db.select().from(weeklyNewsletterIssues).where(eq(weeklyNewsletterIssues.driveFileId, driveFileId)).limit(1);
  return issue ?? null;
}

export async function getWeeklyNewsletterIssueByIssueDate(issueDate: string) {
  const db = await getDb();
  if (!db) return null;
  const [issue] = await db
    .select()
    .from(weeklyNewsletterIssues)
    .where(eq(weeklyNewsletterIssues.issueDate, issueDate))
    .orderBy(desc(weeklyNewsletterIssues.updatedAt))
    .limit(1);
  return issue ?? null;
}

export async function createWeeklyNewsletterIssue(data: InsertWeeklyNewsletterIssue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(weeklyNewsletterIssues).values(data);
  return getWeeklyNewsletterIssueById(result.insertId);
}

export async function updateWeeklyNewsletterIssue(id: number, data: Partial<InsertWeeklyNewsletterIssue>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(weeklyNewsletterIssues).set(data).where(eq(weeklyNewsletterIssues.id, id));
  return getWeeklyNewsletterIssueById(id);
}

export async function getWeeklyNewsletterSyncSettings() {
  const db = await getDb();
  if (!db) return null;
  const [settings] = await db.select().from(weeklyNewsletterSyncSettings).where(eq(weeklyNewsletterSyncSettings.id, 1)).limit(1);
  return settings ?? null;
}

export async function updateWeeklyNewsletterSyncSettings(data: Partial<typeof weeklyNewsletterSyncSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(weeklyNewsletterSyncSettings).values({ id: 1, ...data }).onDuplicateKeyUpdate({ set: data });
  return getWeeklyNewsletterSyncSettings();
}

export async function insertContactMessage(data: InsertContactMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(contactMessages).values(data);
  return result;
}

export async function listContactMessages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

// Daily Meditation queries
export async function insertDailyMeditation(data: InsertDailyMeditation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(dailyMeditations).values(data);
  return result;
}

export async function getDailyMeditationByDate(meditationDate: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(dailyMeditations)
    .where(eq(dailyMeditations.meditationDate, meditationDate));
  return row || null;
}

export async function listDailyMeditations(limit = 30, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(dailyMeditations)
    .orderBy(desc(dailyMeditations.meditationDate))
    .limit(limit)
    .offset(offset);
}

export async function updateDailyMeditation(id: number, data: Partial<InsertDailyMeditation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dailyMeditations).set(data).where(eq(dailyMeditations.id, id));
  return getDailyMeditationById(id);
}

export async function getDailyMeditationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(dailyMeditations).where(eq(dailyMeditations.id, id));
  return row || null;
}

export async function deleteDailyMeditation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dailyMeditations).where(eq(dailyMeditations.id, id));
}

// Personal meditation note queries. Notes are intentionally scoped by both
// meditation and user, so no caller can read another member's private answers.
export async function getMeditationNoteForUser(meditationId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(meditationNotes)
    .where(and(eq(meditationNotes.meditationId, meditationId), eq(meditationNotes.userId, userId)))
    .limit(1);
  return row || null;
}

export async function upsertMeditationNote(
  data: Pick<InsertMeditationNote, "meditationId" | "userId" | "questionOne" | "questionTwo" | "questionThree">,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(meditationNotes).values(data).onDuplicateKeyUpdate({
    set: {
      questionOne: data.questionOne,
      questionTwo: data.questionTwo,
      questionThree: data.questionThree,
      updatedAt: new Date(),
    },
  });
  return getMeditationNoteForUser(data.meditationId, data.userId);
}

// Church calendar event queries
export async function listCalendarEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).orderBy(desc(calendarEvents.startAt));
}

/** Public feeds only receive events explicitly marked published. */
export async function listPublishedCalendarEvents(): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.status, "published"))
    .orderBy(asc(calendarEvents.startAt));
}

export async function getCalendarEventById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
  return row ?? null;
}

export async function createCalendarEvent(data: InsertCalendarEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(calendarEvents).values(data);
  return getCalendarEventById(Number(result.insertId));
}

export async function updateCalendarEvent(id: number, data: Partial<InsertCalendarEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id));
  return getCalendarEventById(id);
}

export async function deleteCalendarEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}

// ── Church Photo Gallery ────────────────────────────────────────────────────

export type PhotoGalleryCategory = "worship" | "prayer" | "fellowship" | "ministry" | "special" | "community" | "other";

export async function getPhotoAlbumById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [album] = await db.select().from(photoAlbums).where(eq(photoAlbums.id, id)).limit(1);
  return album ?? null;
}

export async function listPhotoAlbumsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photoAlbums).orderBy(desc(photoAlbums.albumDate), desc(photoAlbums.createdAt));
}

export async function listGalleryPhotosForAdmin(albumId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(galleryPhotos)
    .where(eq(galleryPhotos.albumId, albumId))
    .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.id));
}

/** Public cards only include explicitly published albums and photos. */
export async function listPublishedPhotoAlbums(category?: PhotoGalleryCategory) {
  const db = await getDb();
  if (!db) return [];
  const condition = category
    ? and(eq(photoAlbums.status, "published"), eq(photoAlbums.category, category))
    : eq(photoAlbums.status, "published");
  const albums = await db
    .select()
    .from(photoAlbums)
    .where(condition)
    .orderBy(desc(photoAlbums.albumDate), desc(photoAlbums.createdAt));

  return Promise.all(albums.map(async (album) => {
    const photos = await db
      .select()
      .from(galleryPhotos)
      .where(and(eq(galleryPhotos.albumId, album.id), eq(galleryPhotos.status, "published")))
      .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.id));
    const coverPhoto = (album.coverPhotoId ? photos.find((photo) => photo.id === album.coverPhotoId) : undefined) ?? photos[0] ?? null;
    return { ...album, coverPhoto, photoCount: photos.length };
  }));
}

/** A public album is readable only when the album itself and its photos are published. */
export async function getPublishedPhotoAlbum(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [album] = await db
    .select()
    .from(photoAlbums)
    .where(and(eq(photoAlbums.id, id), eq(photoAlbums.status, "published")))
    .limit(1);
  if (!album) return null;
  const photos = await db
    .select()
    .from(galleryPhotos)
    .where(and(eq(galleryPhotos.albumId, id), eq(galleryPhotos.status, "published")))
    .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.id));
  return { ...album, photos };
}

export async function createPhotoAlbum(data: InsertPhotoAlbum) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(photoAlbums).values(data);
  return getPhotoAlbumById(Number(result.insertId));
}

export async function updatePhotoAlbum(id: number, data: Partial<InsertPhotoAlbum>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(photoAlbums).set(data).where(eq(photoAlbums.id, id));
  return getPhotoAlbumById(id);
}

/** Deletes metadata only; unreferenced storage files become inaccessible. */
export async function deletePhotoAlbum(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(galleryPhotos).where(eq(galleryPhotos.albumId, id));
  await db.delete(photoAlbums).where(eq(photoAlbums.id, id));
}

export async function getGalleryPhotoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, id)).limit(1);
  return photo ?? null;
}

export async function createGalleryPhoto(data: InsertGalleryPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(galleryPhotos).values(data);
  return getGalleryPhotoById(Number(result.insertId));
}

export async function updateGalleryPhoto(id: number, data: Partial<InsertGalleryPhoto>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(galleryPhotos).set(data).where(eq(galleryPhotos.id, id));
  return getGalleryPhotoById(id);
}

/** Publishes only draft photos in the requested album; hidden photos remain hidden. */
export async function publishDraftGalleryPhotos(albumId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db
    .update(galleryPhotos)
    .set({ status: "published" })
    .where(and(eq(galleryPhotos.albumId, albumId), eq(galleryPhotos.status, "draft")));
  return Number(result.affectedRows ?? 0);
}

/** Updates only the selected photos belonging to one album. */
export async function hideGalleryPhotosInAlbum(albumId: number, photoIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db
    .update(galleryPhotos)
    .set({ status: "hidden" })
    .where(and(eq(galleryPhotos.albumId, albumId), inArray(galleryPhotos.id, photoIds)));
  return Number(result.affectedRows ?? 0);
}

/** Deletes metadata only for the selected photos belonging to one album. */
export async function deleteGalleryPhotosInAlbum(albumId: number, photoIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db
    .delete(galleryPhotos)
    .where(and(eq(galleryPhotos.albumId, albumId), inArray(galleryPhotos.id, photoIds)));
  return Number(result.affectedRows ?? 0);
}

export async function deleteGalleryPhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
}

export async function getGalleryPhotoByGooglePhotosSourceItemId(sourceItemId: string) {
  const db = await getDb();
  if (!db) return null;
  const [photo] = await db
    .select()
    .from(galleryPhotos)
    .where(and(eq(galleryPhotos.source, "google_photos"), eq(galleryPhotos.sourceItemId, sourceItemId)))
    .limit(1);
  return photo ?? null;
}

// ── Google Photos OAuth connection ─────────────────────────────────────────

export async function getGooglePhotosConnectionForUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [connection] = await db
    .select()
    .from(googlePhotosConnections)
    .where(eq(googlePhotosConnections.userId, userId))
    .limit(1);
  return connection ?? null;
}

export async function saveGooglePhotosConnection(data: InsertGooglePhotosConnection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(googlePhotosConnections).values(data).onDuplicateKeyUpdate({
    set: {
      googleAccountEmail: data.googleAccountEmail,
      encryptedRefreshToken: data.encryptedRefreshToken,
      scope: data.scope,
      connectedAt: new Date(),
    },
  });
  return getGooglePhotosConnectionForUser(data.userId);
}

export async function deleteGooglePhotosConnectionForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(googlePhotosConnections).where(eq(googlePhotosConnections.userId, userId));
}

export async function createGooglePhotosOAuthState(state: string, userId: number, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(googlePhotosOAuthStates).values({ state, userId, expiresAt });
}

/** Reads and removes a single-use OAuth CSRF state token. */
export async function consumeGooglePhotosOAuthState(state: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db
    .select()
    .from(googlePhotosOAuthStates)
    .where(eq(googlePhotosOAuthStates.state, state))
    .limit(1);
  if (!record) return null;
  await db.delete(googlePhotosOAuthStates).where(eq(googlePhotosOAuthStates.state, state));
  if (record.expiresAt.getTime() < Date.now()) return null;
  return record;
}

// Meditation comment queries
export async function insertMeditationComment(data: InsertMeditationComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(meditationComments).values(data);
  return result;
}

export async function listMeditationComments(
  meditationId: number,
  viewerUserId?: number,
  limit = 10,
  offset = 0,
) {
  const db = await getDb();
  if (!db) return { items: [], total: 0, nextOffset: null };

  const [totalRow] = await db
    .select({ total: count() })
    .from(meditationComments)
    .where(and(eq(meditationComments.meditationId, meditationId), isNull(meditationComments.parentCommentId)));

  const rootComments = await db
    .select({
      id: meditationComments.id,
      meditationId: meditationComments.meditationId,
      parentCommentId: meditationComments.parentCommentId,
      authorId: meditationComments.authorId,
      content: meditationComments.content,
      likeCount: meditationComments.likeCount,
      createdAt: meditationComments.createdAt,
      updatedAt: meditationComments.updatedAt,
      authorName: users.name,
    })
    .from(meditationComments)
    .innerJoin(users, eq(meditationComments.authorId, users.id))
    .where(and(eq(meditationComments.meditationId, meditationId), isNull(meditationComments.parentCommentId)))
    .orderBy(desc(meditationComments.createdAt))
    .limit(limit)
    .offset(offset);

  const rootIds = rootComments.map((comment) => comment.id);
  const replies = rootIds.length === 0
    ? []
    : await db
        .select({
          id: meditationComments.id,
          meditationId: meditationComments.meditationId,
          parentCommentId: meditationComments.parentCommentId,
          authorId: meditationComments.authorId,
          content: meditationComments.content,
          likeCount: meditationComments.likeCount,
          createdAt: meditationComments.createdAt,
          updatedAt: meditationComments.updatedAt,
          authorName: users.name,
        })
        .from(meditationComments)
        .innerJoin(users, eq(meditationComments.authorId, users.id))
        .where(inArray(meditationComments.parentCommentId, rootIds))
        .orderBy(asc(meditationComments.createdAt));

  const allCommentIds = [...rootIds, ...replies.map((reply) => reply.id)];
  const likedCommentIds = new Set<number>();
  if (viewerUserId && allCommentIds.length > 0) {
    const likes = await db
      .select({ commentId: meditationCommentLikes.commentId })
      .from(meditationCommentLikes)
      .where(and(eq(meditationCommentLikes.userId, viewerUserId), inArray(meditationCommentLikes.commentId, allCommentIds)));
    likes.forEach((like) => likedCommentIds.add(like.commentId));
  }

  const repliesByParent = new Map<number, Array<(typeof replies)[number] & { hasLiked: boolean }>>();
  replies.forEach((reply) => {
    if (reply.parentCommentId === null) return;
    const existing = repliesByParent.get(reply.parentCommentId) ?? [];
    existing.push({ ...reply, hasLiked: likedCommentIds.has(reply.id) });
    repliesByParent.set(reply.parentCommentId, existing);
  });

  const total = Number(totalRow?.total ?? 0);
  return {
    items: rootComments.map((comment) => ({
      ...comment,
      hasLiked: likedCommentIds.has(comment.id),
      replies: repliesByParent.get(comment.id) ?? [],
    })),
    total,
    nextOffset: offset + rootComments.length < total ? offset + rootComments.length : null,
  };
}

export async function getMeditationCommentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(meditationComments)
    .where(eq(meditationComments.id, id));
  return row || null;
}

export async function deleteMeditationComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const replies = await db
    .select({ id: meditationComments.id })
    .from(meditationComments)
    .where(eq(meditationComments.parentCommentId, id));
  const commentIds = [id, ...replies.map((reply) => reply.id)];
  await db.delete(meditationCommentLikes).where(inArray(meditationCommentLikes.commentId, commentIds));
  await db.delete(meditationComments).where(inArray(meditationComments.id, commentIds));
}

export async function toggleMeditationCommentLike(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select()
    .from(meditationCommentLikes)
    .where(and(eq(meditationCommentLikes.commentId, commentId), eq(meditationCommentLikes.userId, userId)));

  if (existing) {
    await db.delete(meditationCommentLikes).where(eq(meditationCommentLikes.id, existing.id));
    await db
      .update(meditationComments)
      .set({ likeCount: sql`GREATEST(${meditationComments.likeCount} - 1, 0)` })
      .where(eq(meditationComments.id, commentId));
    return false;
  }

  await db.insert(meditationCommentLikes).values({ commentId, userId });
  await db
    .update(meditationComments)
    .set({ likeCount: sql`${meditationComments.likeCount} + 1` })
    .where(eq(meditationComments.id, commentId));
  return true;
}

// Meditation like queries
export async function toggleMeditationLike(meditationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already liked
  const [existing] = await db
    .select()
    .from(meditationLikes)
    .where(and(eq(meditationLikes.meditationId, meditationId), eq(meditationLikes.userId, userId)));
  
  if (existing) {
    // Unlike
    await db.delete(meditationLikes).where(eq(meditationLikes.id, existing.id));
    await db
      .update(dailyMeditations)
      .set({ likeCount: sql`${dailyMeditations.likeCount} - 1` })
      .where(eq(dailyMeditations.id, meditationId));
    return false; // unliked
  } else {
    // Like
    await db.insert(meditationLikes).values({ meditationId, userId });
    await db
      .update(dailyMeditations)
      .set({ likeCount: sql`${dailyMeditations.likeCount} + 1` })
      .where(eq(dailyMeditations.id, meditationId));
    return true; // liked
  }
}

export async function getUserMeditationLike(meditationId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(meditationLikes)
    .where(and(eq(meditationLikes.meditationId, meditationId), eq(meditationLikes.userId, userId)));
  return row || null;
}
