export type YouTubeVideoKind = "sermon" | "worship";

export const YOUTUBE_PLAYLISTS: Record<YouTubeVideoKind, string> = {
  sermon: "PLaopWsEpktrg",
  worship: "PLbz1T5cqPAns",
};

export type PlaylistVideo = {
  videoKind: YouTubeVideoKind;
  videoId: string;
  playlistItemId: string;
  title: string;
  speaker?: string;
  publishedAt: Date;
  thumbnailUrl: string;
  playlistPosition: number;
};

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

async function fetchSermonSpeakers(videoIds: string[], apiKey: string) {
  const speakersByVideoId = new Map<string, string>();

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
        const speaker = extractSermonSpeaker(item.snippet?.description);
        if (videoId && speaker) speakersByVideoId.set(videoId, speaker);
      }
    } catch {
      // Speaker metadata is optional. A transient details lookup must not block
      // the existing playlist sync or erase the default speaker fallback.
    }
  }

  return speakersByVideoId;
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

  if (videoKind !== "sermon" || videos.length === 0) return videos;

  const speakersByVideoId = await fetchSermonSpeakers(videos.map((video) => video.videoId), apiKey);
  return videos.map((video) => ({
    ...video,
    speaker: speakersByVideoId.get(video.videoId),
  }));
}
