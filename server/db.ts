import { and, asc, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  contactMessages,
  dailyMeditations,
  InsertContactMessage,
  InsertDailyMeditation,
  InsertMediaFile,
  InsertMeditationComment,
  InsertNewsletterSubscriber,
  InsertUser,
  mediaFiles,
  meditationComments,
  meditationLikes,
  newsletterSubscribers,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

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

/**
 * Newsletter signup. Idempotent by email: a repeat submission refreshes the
 * language preference and re-activates a previously unsubscribed address rather
 * than erroring out, so the visitor always sees a success state.
 */
export async function subscribeToNewsletter(data: InsertNewsletterSubscriber) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(newsletterSubscribers)
    .values(data)
    .onDuplicateKeyUpdate({
      set: { lang: data.lang ?? "en", isActive: 1 },
    });

  const [row] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, data.email))
    .limit(1);

  return row;
}

export async function listNewsletterSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.isActive, 1))
    .orderBy(desc(newsletterSubscribers.createdAt));
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

// Meditation comment queries
export async function insertMeditationComment(data: InsertMeditationComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(meditationComments).values(data);
  return result;
}

export async function listMeditationComments(meditationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(meditationComments)
    .where(eq(meditationComments.meditationId, meditationId))
    .orderBy(asc(meditationComments.createdAt));
}

export async function deleteMeditationComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(meditationComments).where(eq(meditationComments.id, id));
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
