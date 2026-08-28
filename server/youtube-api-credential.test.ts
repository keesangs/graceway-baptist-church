import { describe, expect, it } from "vitest";

const playlists = [
  { label: "sermon", id: "PLaopWsEpktrg" },
  { label: "worship", id: "PLbz1T5cqPAns" },
] as const;

describe("YouTube Data API credential", () => {
  it("can read both configured public playlists", async () => {
    const apiKey = process.env.YOUTUBE_DATA_API_KEY;
    expect(apiKey).toBeTruthy();

    const responses = await Promise.all(playlists.map(async (playlist) => {
      const endpoint = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      endpoint.searchParams.set("part", "snippet");
      endpoint.searchParams.set("playlistId", playlist.id);
      endpoint.searchParams.set("maxResults", "1");
      endpoint.searchParams.set("key", apiKey!);
      const response = await fetch(endpoint);
      const body = (await response.json()) as { items?: unknown[] };
      return { label: playlist.label, status: response.status, body };
    }));

    responses.forEach(({ label, status, body }) => {
      expect(status, `${label} playlist response`).toBe(200);
      expect(Array.isArray(body.items), `${label} playlist payload`).toBe(true);
    });
  }, 15_000);
});
