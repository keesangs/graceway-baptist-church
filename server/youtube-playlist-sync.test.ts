import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractSermonSpeaker,
  extractSermonScripture,
  extractSermonTitle,
  fetchPlaylistVideos,
  isOfficialChannelSyncEligible,
  OFFICIAL_CHANNEL_SYNC_CUTOVER,
  YOUTUBE_PLAYLISTS,
} from "./youtube";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("YouTube playlist sync", () => {
  it("normalizes valid playlist items and skips incomplete items", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "playlist-item-1",
              snippet: {
                title: "2026. 09.20 Sunday sermon",
                publishedAt: "2026-09-20T20:00:00Z",
                position: 0,
                resourceId: { videoId: "video-1" },
                thumbnails: { high: { url: "https://img.youtube.com/vi/video-1/hqdefault.jpg" } },
              },
            },
            { id: "incomplete", snippet: { title: "No video ID" } },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: "video-1", snippet: { description: "제목: 영생과 천국 - 하나님을 알고 다시 하나님께\n설교자: 조명제 전도사\n본문: 요한복음 17장 3절" } }],
        }),
      }) as unknown as typeof fetch;

    const videos = await fetchPlaylistVideos("sermon", "test-key");

    expect(videos).toEqual([
      expect.objectContaining({
        videoKind: "sermon",
        videoId: "video-1",
        playlistItemId: "playlist-item-1",
        title: "2026. 09.20 Sunday sermon",
        sermonTitle: "영생과 천국 - 하나님을 알고 다시 하나님께",
        speaker: "조명제 전도사",
        scripture: "요한복음 17장 3절",
        playlistPosition: 0,
      }),
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("prefers the high thumbnail when a max-resolution placeholder is also present", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{
          id: "playlist-item-2",
          snippet: {
            title: "2026. 09.20 Sunday worship",
            publishedAt: "2026-09-20T20:00:00Z",
            position: 1,
            resourceId: { videoId: "video-2" },
            thumbnails: {
              maxres: { url: "https://img.youtube.com/vi/video-2/maxresdefault.jpg" },
              high: { url: "https://img.youtube.com/vi/video-2/hqdefault.jpg" },
            },
          },
        }],
      }),
    }) as unknown as typeof fetch;

    const [video] = await fetchPlaylistVideos("worship", "test-key");

    expect(video?.thumbnailUrl).toBe("https://img.youtube.com/vi/video-2/hqdefault.jpg");
  });

  it("accepts only a labelled speaker line and ignores unstructured names", () => {
    expect(extractSermonSpeaker("제목: 영생과 천국\n설교자: 조명제 전도사\n본문: 요한복음 17:3"))
      .toBe("조명제 전도사");
    expect(extractSermonSpeaker("조명제 전도사 설교\n본문: 요한복음 17:3")).toBeUndefined();
  });

  it("accepts only a labelled scripture line and ignores unstructured references", () => {
    expect(extractSermonScripture("설교자: 조명제 전도사\n본문: 요한복음 17장 3절"))
      .toBe("요한복음 17장 3절");
    expect(extractSermonScripture("요한복음 17장 3절을 함께 읽습니다.")).toBeUndefined();
  });

  it("extracts only a labelled message title from a YouTube description", () => {
    expect(extractSermonTitle("제목: 영생과 천국 - 하나님을 알고 다시 하나님께\n설교자: 조명제 전도사"))
      .toBe("영생과 천국 - 하나님을 알고 다시 하나님께");
    expect(extractSermonTitle("영생과 천국 - 하나님을 알고 다시 하나님께\n설교자: 조명제 전도사"))
      .toBeUndefined();
  });

  it("reads only the official-channel playlists from the September 20 cutover onward", () => {
    expect(YOUTUBE_PLAYLISTS).toEqual({
      sermon: "PLKTwigm12OYo",
      worship: "PLdEsmN364dmw",
    });
    expect(OFFICIAL_CHANNEL_SYNC_CUTOVER).toBe("2026-09-20");
    expect(isOfficialChannelSyncEligible({ title: "2026. 09.13 주일예배 찬양" })).toBe(false);
    expect(isOfficialChannelSyncEligible({ title: "2026. 09.20 주일예배 설교" })).toBe(true);
    expect(isOfficialChannelSyncEligible({ title: "2026. 09.27 주일예배 찬양" })).toBe(true);
    expect(isOfficialChannelSyncEligible({ title: "Sunday Worship" })).toBe(false);
  });
});
