import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getDailyMeditationById: vi.fn(),
  getUserMeditationLike: vi.fn(),
  toggleMeditationLike: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    ...dbMocks,
  };
});

import { appRouter } from "./routers";

const meditation = { id: 7, likeCount: 3 };
const signedInContext = {
  user: { id: 42, role: "user" },
} as never;
const guestContext = { user: null } as never;

describe("meditation like tRPC behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getDailyMeditationById.mockResolvedValue(meditation);
  });

  it("reports count publicly and personal like state only for a signed-in member", async () => {
    dbMocks.getUserMeditationLike.mockResolvedValue({ id: 4 });

    await expect(
      appRouter.createCaller(signedInContext).meditation.likeStatus({ meditationId: 7 }),
    ).resolves.toEqual({ likeCount: 3, hasLiked: true });
    await expect(
      appRouter.createCaller(guestContext).meditation.likeStatus({ meditationId: 7 }),
    ).resolves.toEqual({ likeCount: 3, hasLiked: false });

    expect(dbMocks.getUserMeditationLike).toHaveBeenCalledWith(7, 42);
  });

  it("lets a signed-in member toggle exactly the requested meditation", async () => {
    dbMocks.toggleMeditationLike.mockResolvedValue(true);

    await expect(
      appRouter.createCaller(signedInContext).meditation.toggleLike({ meditationId: 7 }),
    ).resolves.toEqual({ liked: true });

    expect(dbMocks.toggleMeditationLike).toHaveBeenCalledWith(7, 42);
  });

  it("rejects a guest before it can mutate a meditation reaction", async () => {
    await expect(
      appRouter.createCaller(guestContext).meditation.toggleLike({ meditationId: 7 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    expect(dbMocks.toggleMeditationLike).not.toHaveBeenCalled();
  });
});
