import { describe, expect, it } from "vitest";

const sermonPlaylistId = "PLaopWsEpktrg";

describe("YouTube Data API credential", () => {
  it("can read the configured public sermon playlist", async () => {
    const apiKey = process.env.YOUTUBE_DATA_API_KEY;
    expect(apiKey).toBeTruthy();

    const endpoint = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    endpoint.searchParams.set("part", "snippet");
    endpoint.searchParams.set("playlistId", sermonPlaylistId);
    endpoint.searchParams.set("maxResults", "1");
    endpoint.searchParams.set("key", apiKey!);

    const response = await fetch(endpoint);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { items?: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  }, 15_000);
});
