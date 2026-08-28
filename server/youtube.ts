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

  return videos;
}
