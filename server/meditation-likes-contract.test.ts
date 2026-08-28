import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("meditation likes", () => {
  it("keeps one reaction per member and protects mutations behind login", () => {
    const schema = readProjectFile("drizzle/schema.ts");
    const router = readProjectFile("server/routers.ts");
    const page = readProjectFile("client/src/pages/Meditation.tsx");

    expect(schema).toContain('uniqueIndex("unique_meditation_like").on(table.meditationId, table.userId)');
    expect(router).toContain("likeStatus: publicProcedure");
    expect(router).toContain("toggleLike: protectedProcedure");
    expect(page).toContain("trpc.meditation.likeStatus.useQuery");
    expect(page).toContain("trpc.meditation.toggleLike.useMutation");
    expect(page).toContain("handleToggleMeditationLike");
  });
});
