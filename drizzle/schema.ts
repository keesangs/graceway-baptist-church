import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Media files table — stores metadata for uploaded church media
export const mediaFiles = mysqlTable("media_files", {
  id: int("id").autoincrement().primaryKey(),
  /** Original filename as uploaded by the user */
  filename: varchar("filename", { length: 255 }).notNull(),
  /** S3 storage key returned by storagePut */
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  /** Relative URL for serving: /manus-storage/{fileKey} */
  url: varchar("url", { length: 512 }).notNull(),
  /** MIME type e.g. image/jpeg, application/pdf */
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  /** File size in bytes */
  fileSize: int("fileSize").notNull(),
  /** Category tag for filtering */
  category: mysqlEnum("category", ["sermon", "image", "document", "other"]).default("other").notNull(),
  /** Optional description */
  description: text("description"),
  /** Uploader's user id */
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = typeof mediaFiles.$inferInsert;

// YouTube playlist videos — persisted records discovered by an administrator-run sync.
// A video can theoretically appear in both playlists, so its uniqueness is scoped by kind.
export const youtubeVideos = mysqlTable("youtube_videos", {
  id: int("id").autoincrement().primaryKey(),
  videoKind: mysqlEnum("videoKind", ["sermon", "worship"]).notNull(),
  videoId: varchar("videoId", { length: 32 }).notNull(),
  playlistItemId: varchar("playlistItemId", { length: 128 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  speaker: varchar("speaker", { length: 160 }),
  scripture: varchar("scripture", { length: 500 }),
  publishedAt: timestamp("publishedAt").notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 1024 }).notNull(),
  playlistPosition: int("playlistPosition").notNull(),
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueVideoKind: uniqueIndex("youtube_video_kind_unique").on(table.videoKind, table.videoId),
  kindPublishedIdx: index("youtube_video_kind_published_idx").on(table.videoKind, table.publishedAt),
}));

export type YouTubeVideo = typeof youtubeVideos.$inferSelect;
export type InsertYouTubeVideo = typeof youtubeVideos.$inferInsert;

// Newsletter subscribers — collected from the Home page signup form.
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  /** Subscriber email. Unique so re-submitting the same address is idempotent. */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Preferred language at signup time, used when sending the newsletter. */
  lang: mysqlEnum("lang", ["en", "ko"]).default("en").notNull(),
  /** Set to false instead of deleting the row, so unsubscribes stay auditable. */
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// Weekly newsletter issues — public PDF copies of the church bulletin. The PDF
// bytes live in storage; this table tracks the Drive source, public status, and
// archive metadata needed to keep the last successful bulletin visible on sync failure.
export const weeklyNewsletterIssues = mysqlTable("weekly_newsletter_issues", {
  id: int("id").autoincrement().primaryKey(),
  /** Church-local Sunday in YYYY-MM-DD format; date-only by design to avoid timezone drift. */
  issueDate: varchar("issueDate", { length: 10 }).notNull(),
  titleKo: varchar("titleKo", { length: 255 }).notNull(),
  titleEn: varchar("titleEn", { length: 255 }),
  sourceFilename: varchar("sourceFilename", { length: 512 }).notNull(),
  /** Stable public Google Drive file identifier, unique for idempotent syncs. */
  driveFileId: varchar("driveFileId", { length: 128 }).unique(),
  sourceModifiedAt: timestamp("sourceModifiedAt"),
  /** Durable copy in the website's managed object storage. */
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
  fileSize: int("fileSize").notNull(),
  status: mysqlEnum("status", ["draft", "published", "hidden"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  issueDateIdx: index("weekly_newsletter_issue_date_idx").on(table.issueDate),
  statusIssueDateIdx: index("weekly_newsletter_status_issue_date_idx").on(table.status, table.issueDate),
}));

export type WeeklyNewsletterIssue = typeof weeklyNewsletterIssues.$inferSelect;
export type InsertWeeklyNewsletterIssue = typeof weeklyNewsletterIssues.$inferInsert;

// Singleton configuration row for the project-level Sunday bulletin sync.
export const weeklyNewsletterSyncSettings = mysqlTable("weekly_newsletter_sync_settings", {
  id: int("id").primaryKey(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }).unique(),
  lastRunAt: timestamp("lastRunAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  lastError: text("lastError"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyNewsletterSyncSettings = typeof weeklyNewsletterSyncSettings.$inferSelect;

// Contact form submissions from the Connect page.
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  /** Which of the Connect form's dropdown reasons the visitor picked. */
  topic: mysqlEnum("topic", ["visit", "prayer", "ministry", "general"]).default("general").notNull(),
  message: text("message"),
  /** Church staff workflow state. */
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

// Daily Bible meditations — daily devotional readings and reflections
export const dailyMeditations = mysqlTable("daily_meditations", {
  id: int("id").autoincrement().primaryKey(),
  /** Date of the meditation (YYYY-MM-DD format stored as string for consistency) */
  meditationDate: varchar("meditationDate", { length: 10 }).notNull().unique(),
  /** Scripture reference e.g. "John 3:16" */
  scriptureReference: varchar("scriptureReference", { length: 255 }).notNull(),
  /** Optional English scripture reference, e.g. "John 3:16". */
  scriptureReferenceEn: varchar("scriptureReferenceEn", { length: 255 }),
  /** Scripture text (full passage) */
  scriptureText: text("scriptureText").notNull(),
  /** Optional licensed English Scripture text for English-mode readers. */
  scriptureTextEn: text("scriptureTextEn"),
  /** Meditation title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Optional English meditation title. */
  titleEn: varchar("titleEn", { length: 255 }),
  /** Meditation content/reflection */
  content: text("content").notNull(),
  /** Optional English meditation reflection. */
  contentEn: text("contentEn"),
  /** Author/creator user id */
  authorId: int("authorId").notNull(),
  /** Like count for this meditation */
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyMeditation = typeof dailyMeditations.$inferSelect;
export type InsertDailyMeditation = typeof dailyMeditations.$inferInsert;

// Personal meditation notes — private QT answers owned by one signed-in user.
// A user may keep one note for each published daily meditation.
export const meditationNotes = mysqlTable("meditation_notes", {
  id: int("id").autoincrement().primaryKey(),
  meditationId: int("meditationId").notNull(),
  userId: int("userId").notNull(),
  questionOne: text("questionOne").notNull(),
  questionTwo: text("questionTwo").notNull(),
  questionThree: text("questionThree").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueUserMeditationNote: uniqueIndex("meditation_note_user_meditation_unique").on(table.userId, table.meditationId),
  userUpdatedIdx: index("meditation_note_user_updated_idx").on(table.userId, table.updatedAt),
}));

export type MeditationNote = typeof meditationNotes.$inferSelect;
export type InsertMeditationNote = typeof meditationNotes.$inferInsert;

// Meditation comments — user reflections and responses to daily meditations
export const meditationComments = mysqlTable("meditation_comments", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to daily_meditations */
  meditationId: int("meditationId").notNull(),
  /** Null for a top-level reflection; set when this is a reply to another comment. */
  parentCommentId: int("parentCommentId"),
  /** Comment author user id */
  authorId: int("authorId").notNull(),
  /** Comment text */
  content: text("content").notNull(),
  /** Cached reaction total for fast comment-list rendering. */
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  meditationThreadIdx: index("meditation_comment_thread_idx").on(table.meditationId, table.parentCommentId, table.createdAt),
}));

export type MeditationComment = typeof meditationComments.$inferSelect;
export type InsertMeditationComment = typeof meditationComments.$inferInsert;

// Meditation likes — track which users liked which meditations
export const meditationLikes = mysqlTable("meditation_likes", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to daily_meditations */
  meditationId: int("meditationId").notNull(),
  /** User who liked the meditation */
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  /** Ensure each user can only like a meditation once */
  unique: uniqueIndex("unique_meditation_like").on(table.meditationId, table.userId),
}));

export type MeditationLike = typeof meditationLikes.$inferSelect;
export type InsertMeditationLike = typeof meditationLikes.$inferInsert;

// Meditation comment likes — one reaction per user for each comment.
export const meditationCommentLikes = mysqlTable("meditation_comment_likes", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  unique: uniqueIndex("unique_meditation_comment_like").on(table.commentId, table.userId),
  commentIdx: index("meditation_comment_like_comment_idx").on(table.commentId),
}));

export type MeditationCommentLike = typeof meditationCommentLikes.$inferSelect;
export type InsertMeditationCommentLike = typeof meditationCommentLikes.$inferInsert;

// Church calendar events — the single source of truth for the public calendar
// and Home's upcoming-event cards. All timestamps persist as UTC Date values.
// For all-day events, the application stores the America/Los_Angeles day
// boundaries as UTC instants and formats them back in that same timezone.
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  titleKo: varchar("titleKo", { length: 255 }).notNull(),
  titleEn: varchar("titleEn", { length: 255 }),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt"),
  allDay: int("allDay").default(0).notNull(),
  venueKo: varchar("venueKo", { length: 255 }),
  venueEn: varchar("venueEn", { length: 255 }),
  descriptionKo: text("descriptionKo"),
  descriptionEn: text("descriptionEn"),
  eventType: mysqlEnum("eventType", ["worship", "prayer", "fellowship", "ministry", "special", "other"])
    .default("other")
    .notNull(),
  status: mysqlEnum("status", ["draft", "published", "cancelled"]).default("draft").notNull(),
  recurrence: mysqlEnum("recurrence", ["none", "weekly"]).default("none").notNull(),
  recurrenceUntil: timestamp("recurrenceUntil"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusStartIdx: index("calendar_event_status_start_idx").on(table.status, table.startAt),
  recurrenceUntilIdx: index("calendar_event_recurrence_until_idx").on(table.recurrence, table.recurrenceUntil),
}));

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// Church photo albums — editorial groups of approved photos from worship,
// gatherings, ministries, and special events. An album and each photo have a
// distinct public state so staff can safely review content before publishing.
export const photoAlbums = mysqlTable("photo_albums", {
  id: int("id").autoincrement().primaryKey(),
  titleKo: varchar("titleKo", { length: 255 }).notNull(),
  titleEn: varchar("titleEn", { length: 255 }),
  descriptionKo: text("descriptionKo"),
  descriptionEn: text("descriptionEn"),
  /** Church-local event date in YYYY-MM-DD format; null for an undated album. */
  albumDate: varchar("albumDate", { length: 10 }),
  category: mysqlEnum("category", ["worship", "prayer", "fellowship", "ministry", "special", "community", "other"]).default("other").notNull(),
  status: mysqlEnum("status", ["draft", "published", "hidden"]).default("draft").notNull(),
  /** References gallery_photos.id after a cover photo is selected; no DB FK to avoid a circular creation dependency. */
  coverPhotoId: int("coverPhotoId"),
  createdBy: int("createdBy").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusDateIdx: index("photo_album_status_date_idx").on(table.status, table.albumDate),
  categoryStatusIdx: index("photo_album_category_status_idx").on(table.category, table.status),
}));

export type PhotoAlbum = typeof photoAlbums.$inferSelect;
export type InsertPhotoAlbum = typeof photoAlbums.$inferInsert;

// Church gallery photos — original bytes remain in storage; the database only
// contains display metadata and the storage reference. Google Photos imported
// records retain a stable source ID for idempotent staff-authorized imports.
export const galleryPhotos = mysqlTable("gallery_photos", {
  id: int("id").autoincrement().primaryKey(),
  albumId: int("albumId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSize: int("fileSize").notNull(),
  captionKo: varchar("captionKo", { length: 500 }),
  captionEn: varchar("captionEn", { length: 500 }),
  altTextKo: varchar("altTextKo", { length: 500 }),
  altTextEn: varchar("altTextEn", { length: 500 }),
  source: mysqlEnum("source", ["manual", "google_photos"]).default("manual").notNull(),
  sourceItemId: varchar("sourceItemId", { length: 255 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "published", "hidden"]).default("draft").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  albumStatusOrderIdx: index("gallery_photo_album_status_order_idx").on(table.albumId, table.status, table.sortOrder),
  uniqueSourceItem: uniqueIndex("gallery_photo_source_item_unique").on(table.source, table.sourceItemId),
}));

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type InsertGalleryPhoto = typeof galleryPhotos.$inferInsert;

// Per-admin Google Photos OAuth connection. Refresh tokens are encrypted before
// persistence; no raw access token or selected photo URL is stored in this table.
export const googlePhotosConnections = mysqlTable("google_photos_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  googleAccountEmail: varchar("googleAccountEmail", { length: 320 }),
  encryptedRefreshToken: text("encryptedRefreshToken").notNull(),
  scope: varchar("scope", { length: 1024 }).notNull(),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GooglePhotosConnection = typeof googlePhotosConnections.$inferSelect;
export type InsertGooglePhotosConnection = typeof googlePhotosConnections.$inferInsert;

// Short-lived, single-use CSRF state records for the Google OAuth callback.
// This is separate from Picker sessions and contains no Google credential.
export const googlePhotosOAuthStates = mysqlTable("google_photos_oauth_states", {
  state: varchar("state", { length: 128 }).primaryKey(),
  userId: int("userId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  expiresIdx: index("google_photos_oauth_state_expires_idx").on(table.expiresAt),
}));

export type GooglePhotosOAuthState = typeof googlePhotosOAuthStates.$inferSelect;
