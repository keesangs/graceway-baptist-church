import { eq } from "drizzle-orm";
import { discordTtsPreferences } from "../drizzle/schema";
import { getDb } from "./db";

export type SavedVoiceControls = { speaker: string; speed: number; temperature: number };

export async function readVoicePreferences() {
  const db = await getDb();
  if (!db) throw new Error("Voice preference database is unavailable.");
  const [row] = await db.select().from(discordTtsPreferences).where(eq(discordTtsPreferences.id, 1)).limit(1);
  return row?.controls ?? null;
}

export async function saveVoicePreferences(controls: SavedVoiceControls) {
  const db = await getDb();
  if (!db) throw new Error("Voice preference database is unavailable; settings were not applied.");
  const safeControls = { speaker: controls.speaker, speed: controls.speed, temperature: controls.temperature };
  const updatedAtMs = Date.now();
  await db.insert(discordTtsPreferences).values({ id: 1, controls: safeControls, updatedAtMs })
    .onDuplicateKeyUpdate({ set: { controls: safeControls, updatedAtMs } });
}
