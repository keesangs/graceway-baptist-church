export type SermonDisplayData = {
  date: string;
  title: string;
  titleKo: string;
  scripture: string;
  scriptureEn: string;
};

/**
 * Public-facing sermon card data shared by Home and the sermon archive.
 * The database retains every playlist video; this type represents the one
 * canonical card selected for each Sunday service in the public UI.
 */
export type CanonicalSermonCard = SermonDisplayData & {
  speaker: string;
  duration: string;
  series?: string;
  videoId: string;
  thumbnailUrl?: string;
  publishedAt?: Date | string;
  playlistPosition?: number;
  sermonDateTimestamp?: number;
};

export type SyncedSermonVideo = {
  videoId: string;
  title: string;
  speaker?: string | null;
  scripture?: string | null;
  publishedAt: Date | string;
  thumbnailUrl: string;
  playlistPosition: number;
};

export const DEFAULT_SERMON_SPEAKER = "이헌석 목사";

const PUBLIC_SERMON_SPEAKER_NAMES: Record<string, string> = {
  "이헌석 목사": "Pastor Hunsuk Lee",
  "Pastor Hunsuk Lee": "Pastor Hunsuk Lee",
  "조명제 전도사": "Staff Pastor MyeongJe Cho",
  "Staff Pastor MyeongJe Cho": "Staff Pastor MyeongJe Cho",
};

/** Uses the church-approved English display name for known sermon speakers. */
export function getPublicSermonSpeaker(speaker: string | null | undefined) {
  const normalized = speaker?.trim() || DEFAULT_SERMON_SPEAKER;
  return PUBLIC_SERMON_SPEAKER_NAMES[normalized] ?? normalized;
}

function getDateFromLabel(value: string) {
  const match = value.match(/(20\d{2})\.\s*(\d{1,2})\.(\d{1,2})/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function getSermonDateTimestamp(title: string, fallback: Date | string) {
  const embeddedDate = getDateFromLabel(title);
  if (embeddedDate) return embeddedDate.getTime();

  // Curated legacy records use readable English service dates (for example,
  // "August 2, 2026"). Resolve those before falling back to YouTube's upload
  // timestamp, which can be days or weeks later than the actual Sunday.
  const suppliedDate = new Date(title).getTime();
  if (!Number.isNaN(suppliedDate)) return suppliedDate;

  const parsed = new Date(fallback).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getServiceDateKey(title: string, fallback: Date | string) {
  const timestamp = getSermonDateTimestamp(title, fallback);
  if (!timestamp) return `video:${title}`;
  return new Date(timestamp).toISOString().slice(0, 10);
}

function isCuratedMessageTitle(title: string) {
  return /주일예배\s*말씀/i.test(title);
}

/**
 * Merges persisted YouTube rows with church-supplied metadata for display.
 * Multiple source videos can be present for one Sunday (for example an
 * alternate recording and the sermon message). Source rows are never deleted;
 * public cards instead select the curated video for that service date.
 */
export function getCanonicalSermonCards(
  legacySermons: CanonicalSermonCard[],
  syncedVideos: SyncedSermonVideo[],
): CanonicalSermonCard[] {
  if (syncedVideos.length === 0) {
    return [...legacySermons]
      .map((sermon) => ({
        ...sermon,
        sermonDateTimestamp: getSermonDateTimestamp(sermon.date, sermon.date),
      }))
      .sort((a, b) => (b.sermonDateTimestamp ?? 0) - (a.sermonDateTimestamp ?? 0));
  }

  const legacyByVideoId = new Map(legacySermons.map((sermon) => [sermon.videoId, sermon]));
  const syncedCards = syncedVideos.map<CanonicalSermonCard>((video) => {
    const legacy = legacyByVideoId.get(video.videoId);
    return {
      title: legacy?.title ?? video.title,
      titleKo: legacy?.titleKo ?? video.title,
      scripture: video.scripture?.trim() || legacy?.scripture || "",
      scriptureEn: legacy?.scriptureEn ?? video.scripture?.trim() ?? "",
      date: legacy?.date ?? new Date(video.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      speaker: getPublicSermonSpeaker(video.speaker?.trim() || legacy?.speaker || DEFAULT_SERMON_SPEAKER),
      duration: legacy?.duration ?? "New",
      series: legacy?.series ?? "Sunday Sermon",
      videoId: video.videoId,
      thumbnailUrl: video.thumbnailUrl,
      publishedAt: video.publishedAt,
      playlistPosition: video.playlistPosition,
      sermonDateTimestamp: getSermonDateTimestamp(legacy?.date ?? video.title, video.publishedAt),
    };
  });

  const pendingLegacy = legacySermons
    .filter((sermon) => !syncedVideos.some((video) => video.videoId === sermon.videoId))
    .map((sermon) => ({
      ...sermon,
      sermonDateTimestamp: getSermonDateTimestamp(sermon.date, sermon.date),
    }));

  const candidateCards = [...syncedCards, ...pendingLegacy];
  const canonicalByServiceDate = new Map<string, CanonicalSermonCard>();

  for (const candidate of candidateCards) {
    const serviceDateKey = getServiceDateKey(candidate.title, candidate.date);
    const current = canonicalByServiceDate.get(serviceDateKey);
    if (!current) {
      canonicalByServiceDate.set(serviceDateKey, candidate);
      continue;
    }

    const candidateIsCurated = legacyByVideoId.has(candidate.videoId) || isCuratedMessageTitle(candidate.title);
    const currentIsCurated = legacyByVideoId.has(current.videoId) || isCuratedMessageTitle(current.title);
    const candidatePosition = candidate.playlistPosition ?? Number.MAX_SAFE_INTEGER;
    const currentPosition = current.playlistPosition ?? Number.MAX_SAFE_INTEGER;

    if (
      (candidateIsCurated && !currentIsCurated) ||
      (candidateIsCurated === currentIsCurated && candidatePosition < currentPosition)
    ) {
      canonicalByServiceDate.set(serviceDateKey, candidate);
    }
  }

  return Array.from(canonicalByServiceDate.values())
    .sort((a, b) => (b.sermonDateTimestamp ?? 0) - (a.sermonDateTimestamp ?? 0));
}

export function formatSermonServiceDate({ date, title }: Pick<SermonDisplayData, "date" | "title">, lang: "ko" | "en") {
  const serviceDate = getDateFromLabel(title) ?? new Date(date);
  if (Number.isNaN(serviceDate.getTime())) return lang === "ko" ? "주일예배 말씀" : "Sunday Worship Message";

  if (lang === "ko") {
    const year = serviceDate.getUTCFullYear();
    const month = String(serviceDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(serviceDate.getUTCDate()).padStart(2, "0");
    return `${year}. ${month}.${day} 주일예배 말씀`;
  }

  return `${serviceDate.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })} Sunday Worship Message`;
}

export function getSermonMetadataLines(sermon: SermonDisplayData, lang: "ko" | "en") {
  if (lang === "ko") {
    return {
      date: formatSermonServiceDate(sermon, lang),
      title: sermon.titleKo,
      scripture: `본문: ${sermon.scripture}`,
    };
  }

  return {
    date: formatSermonServiceDate(sermon, lang),
    title: `Title: ${sermon.title}`,
    scripture: `Scripture: ${sermon.scriptureEn}`,
  };
}
