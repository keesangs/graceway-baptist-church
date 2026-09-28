export type YouTubeVideoKind = "sermon" | "worship";

/**
 * Official Graceway Baptist Church channel playlists. The legacy channel remains
 * represented by persisted archive records; manual syncs must only read these
 * official-channel sources.
 */
export const YOUTUBE_PLAYLISTS: Record<YouTubeVideoKind, string> = {
  sermon: "PLKTwigm12OYo",
  worship: "PLdEsmN364dmw",
};

/**
 * The archive was intentionally preserved when the church moved to its official
 * channel. Only services dated on or after this Sunday may enter from the new
 * playlists, even if a previously published service is later added to them.
 */
export const OFFICIAL_CHANNEL_SYNC_CUTOVER = "2026-09-20";

export type PlaylistVideo = {
  videoKind: YouTubeVideoKind;
  videoId: string;
  playlistItemId: string;
  title: string;
  speaker?: string;
  scripture?: string;
  publishedAt: Date;
  thumbnailUrl: string;
  playlistPosition: number;
};

function getServiceDateFromTitle(title: string) {
  const match = title.match(/\b(20\d{2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})\b/);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? `${yearText}-${monthText.padStart(2, "0")}-${dayText.padStart(2, "0")}`
    : null;
}

/**
 * Sync only dated Sunday-service titles at or after the official-channel
 * handoff. Skipping undated playlist items is deliberate: it protects the
 * legacy archive from accidental backfills from the new channel.
 */
export function isOfficialChannelSyncEligible(video: Pick<PlaylistVideo, "title">) {
  const serviceDate = getServiceDateFromTitle(video.title);
  return serviceDate !== null && serviceDate >= OFFICIAL_CHANNEL_SYNC_CUTOVER;
}

type PlaylistItemsResponse = {
  nextPageToken?: string;
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      publishedAt?: string;
      position?: number;
      resourceId?: { videoId?: string };
      thumbnails?: Record<string, { url?: string }>;
    };
  }>;
};

type VideosResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      description?: string;
    };
  }>;
};

const VIDEO_DETAILS_BATCH_SIZE = 50;

/**
 * Reads the first non-empty `설교자:` line from a YouTube video description.
 * The description remains source content only; no raw description is persisted.
 */
export function extractSermonSpeaker(description: string | undefined) {
  if (!description) return undefined;

  for (const line of description.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:설교자|speaker)\s*[:：]\s*(.+?)\s*$/i);
    const speaker = match?.[1]?.trim();
    if (speaker) return speaker.slice(0, 160);
  }

  return undefined;
}

/** Reads the first non-empty labelled message title from a YouTube description. */
export function extractSermonTitle(description: string | undefined) {
  if (!description) return undefined;

  for (const line of description.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:제목|title|sermon\s+title|message\s+title)\s*[:：]\s*(.+?)\s*$/i);
    const sermonTitle = match?.[1]?.trim();
    if (sermonTitle) return sermonTitle.slice(0, 500);
  }

  return undefined;
}

/** Reads the first non-empty `본문:` line from a YouTube video description. */
export function extractSermonScripture(description: string | undefined) {
  if (!description) return undefined;

  for (const line of description.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:본문|성경\s*본문|scripture|bible\s*passage)\s*[:：]\s*(.+?)\s*$/i);
    const scripture = match?.[1]?.trim();
    if (scripture) return scripture.slice(0, 500);
  }

  return undefined;
}

type SermonVideoMetadata = {
  sermonTitle?: string;
  speaker?: string;
  scripture?: string;
};

async function fetchSermonMetadata(videoIds: string[], apiKey: string) {
  const metadataByVideoId = new Map<string, SermonVideoMetadata>();

  for (let start = 0; start < videoIds.length; start += VIDEO_DETAILS_BATCH_SIZE) {
    const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
    endpoint.searchParams.set("part", "snippet");
    endpoint.searchParams.set("id", videoIds.slice(start, start + VIDEO_DETAILS_BATCH_SIZE).join(","));
    endpoint.searchParams.set("key", apiKey);

    try {
      const response = await fetch(endpoint);
      if (!response.ok) continue;

      const payload = (await response.json()) as VideosResponse;
      for (const item of payload.items ?? []) {
        const videoId = item.id?.trim();
        const sermonTitle = extractSermonTitle(item.snippet?.description);
        const speaker = extractSermonSpeaker(item.snippet?.description);
        const scripture = extractSermonScripture(item.snippet?.description);
        if (videoId && (sermonTitle || speaker || scripture)) {
          metadataByVideoId.set(videoId, { sermonTitle, speaker, scripture });
        }
      }
    } catch {
      // Speaker metadata is optional. A transient details lookup must not block
      // the existing playlist sync or erase the default speaker fallback.
    }
  }

  return metadataByVideoId;
}

function getThumbnailUrl(thumbnails: Record<string, { url?: string }> | undefined) {
  return thumbnails?.high?.url
    ?? thumbnails?.standard?.url
    ?? thumbnails?.maxres?.url
    ?? thumbnails?.medium?.url
    ?? thumbnails?.default?.url
    ?? "";
}

/**
 * Reads every valid video in one public playlist. API errors never include the
 * secret key in the surfaced error message.
 */
export async function fetchPlaylistVideos(
  videoKind: YouTubeVideoKind,
  apiKey = process.env.YOUTUBE_DATA_API_KEY,
): Promise<PlaylistVideo[]> {
  if (!apiKey) throw new Error("YouTube Data API key is not configured");

  const playlistId = YOUTUBE_PLAYLISTS[videoKind];
  const videos: PlaylistVideo[] = [];
  let pageToken: string | undefined;
  const seenTokens = new Set<string>();

  do {
    const endpoint = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    endpoint.searchParams.set("part", "snippet");
    endpoint.searchParams.set("playlistId", playlistId);
    endpoint.searchParams.set("maxResults", "50");
    endpoint.searchParams.set("key", apiKey);
    if (pageToken) endpoint.searchParams.set("pageToken", pageToken);

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`YouTube playlist lookup failed (${response.status})`);
    }

    const payload = (await response.json()) as PlaylistItemsResponse;
    for (const item of payload.items ?? []) {
      const snippet = item.snippet;
      const videoId = snippet?.resourceId?.videoId?.trim();
      const title = snippet?.title?.trim();
      const playlistItemId = item.id?.trim();
      const publishedAt = snippet?.publishedAt ? new Date(snippet.publishedAt) : null;
      const thumbnailUrl = getThumbnailUrl(snippet?.thumbnails);

      if (
        !videoId
        || !title
        || !playlistItemId
        || !publishedAt
        || Number.isNaN(publishedAt.valueOf())
        || !thumbnailUrl
      ) {
        continue;
      }

      videos.push({
        videoKind,
        videoId,
        playlistItemId,
        title,
        publishedAt,
        thumbnailUrl,
        playlistPosition: typeof snippet?.position === "number" && Number.isInteger(snippet.position) ? snippet.position : 0,
      });
    }

    pageToken = payload.nextPageToken;
    if (pageToken && seenTokens.has(pageToken)) break;
    if (pageToken) seenTokens.add(pageToken);
  } while (pageToken);

  const eligibleVideos = videos.filter(isOfficialChannelSyncEligible);

  if (videoKind !== "sermon" || eligibleVideos.length === 0) return eligibleVideos;

  const metadataByVideoId = await fetchSermonMetadata(eligibleVideos.map((video) => video.videoId), apiKey);
  return eligibleVideos.map((video) => ({
    ...video,
    sermonTitle: metadataByVideoId.get(video.videoId)?.sermonTitle,
    speaker: metadataByVideoId.get(video.videoId)?.speaker,
    scripture: metadataByVideoId.get(video.videoId)?.scripture,
  }));
}
