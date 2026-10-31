import { getServiceDateFromLabel, getServiceDateTimestamp as getSermonDateTimestamp, sortByServiceDateDesc } from "@/lib/serviceDate";

export { getServiceDateTimestamp as getSermonDateTimestamp } from "@/lib/serviceDate";

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
  sermonTitle?: string | null;
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
    const legacyCards = [...legacySermons]
      .map((sermon) => ({
        ...sermon,
        sermonDateTimestamp: getSermonDateTimestamp(sermon.date, sermon.date),
      }));
    return sortByServiceDateDesc(legacyCards, (sermon) => sermon.date, (sermon) => sermon.date);
  }

  const legacyByVideoId = new Map(legacySermons.map((sermon) => [sermon.videoId, sermon]));
  const syncedCards = syncedVideos.map<CanonicalSermonCard>((video) => {
    const legacy = legacyByVideoId.get(video.videoId);
    const syncedMessageTitle = video.sermonTitle?.trim();
    return {
      title: legacy?.title ?? syncedMessageTitle ?? video.title,
      titleKo: legacy?.titleKo ?? syncedMessageTitle ?? video.title,
      scripture: video.scripture?.trim() || legacy?.scripture || "",
      scriptureEn: legacy?.scriptureEn ?? video.scripture?.trim() ?? "",
      // Keep the raw dated playlist title in `date`; the message title is a
      // separate field and must never replace the service-date source.
      date: legacy?.date ?? video.title,
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

  return sortByServiceDateDesc(
    Array.from(canonicalByServiceDate.values()),
    (sermon) => sermon.date,
    (sermon) => sermon.publishedAt,
  );
}

export function formatSermonServiceDate({ date, title }: Pick<SermonDisplayData, "date" | "title">, lang: "ko" | "en") {
  // The playlist label carries the service date while the description title
  // carries the actual message title. Prefer the date field so these concerns
  // remain independent after a synchronized video receives a semantic title.
  const serviceDate = getServiceDateFromLabel(date) ?? getServiceDateFromLabel(title) ?? new Date(date);
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
