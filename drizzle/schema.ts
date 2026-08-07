import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/mysql-core";

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
  /** Scripture text (full passage) */
  scriptureText: text("scriptureText").notNull(),
  /** Meditation title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Meditation content/reflection */
  content: text("content").notNull(),
  /** Author/creator user id */
  authorId: int("authorId").notNull(),
  /** Like count for this meditation */
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyMeditation = typeof dailyMeditations.$inferSelect;
export type InsertDailyMeditation = typeof dailyMeditations.$inferInsert;

// Meditation comments — user reflections and responses to daily meditations
export const meditationComments = mysqlTable("meditation_comments", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to daily_meditations */
  meditationId: int("meditationId").notNull(),
  /** Comment author user id */
  authorId: int("authorId").notNull(),
  /** Comment text */
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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