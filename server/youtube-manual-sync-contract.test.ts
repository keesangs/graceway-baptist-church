import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("YouTube manual playlist sync contract", () => {
  it("keeps import admin-only and public archive reads key-free", () => {
    const routers = projectFile("server/routers.ts");

    expect(routers).toContain('youtube: router({');
    expect(routers).toContain('list: publicProcedure');
    expect(routers).toContain('sync: adminProcedure');
    expect(routers).toContain('fetchPlaylistVideos("sermon")');
    expect(routers).toContain('fetchPlaylistVideos("worship")');
  });

  it("uses a video-kind unique key and canonicalizes synced sermon cards by Sunday date", () => {
    const schema = projectFile("drizzle/schema.ts");
    const sermons = projectFile("client/src/pages/Sermons.tsx");
    const worship = projectFile("client/src/pages/Worship.tsx");

    expect(schema).toContain('uniqueIndex("youtube_video_kind_unique").on(table.videoKind, table.videoId)');
    expect(sermons).toContain('trpc.youtube.list.useQuery(SERMON_LIST_INPUT)');
    expect(sermons).toContain('getCanonicalSermonCards(legacyCards, syncedVideosQuery.data ?? [])');
    expect(worship).toContain('trpc.youtube.list.useQuery(WORSHIP_LIST_INPUT)');
    expect(worship).toContain('return [...newSyncedWorships, ...refreshedLegacyWorships]');
  });
});
