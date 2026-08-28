import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPlaylistVideos } from "./youtube";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("YouTube playlist sync", () => {
  it("normalizes valid playlist items and skips incomplete items", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "playlist-item-1",
            snippet: {
              title: "Sunday sermon",
              publishedAt: "2026-08-23T20:00:00Z",
              position: 0,
              resourceId: { videoId: "video-1" },
              thumbnails: { high: { url: "https://img.youtube.com/vi/video-1/hqdefault.jpg" } },
            },
          },
          { id: "incomplete", snippet: { title: "No video ID" } },
        ],
      }),
    }) as unknown as typeof fetch;

    const videos = await fetchPlaylistVideos("sermon", "test-key");

    expect(videos).toEqual([
      expect.objectContaining({
        videoKind: "sermon",
        videoId: "video-1",
        playlistItemId: "playlist-item-1",
        title: "Sunday sermon",
        playlistPosition: 0,
      }),
    ]);
    expect(global.fetch).toHaveBeenCalledOnce();
  });
});
