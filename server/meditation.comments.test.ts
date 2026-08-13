import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const getDailyMeditationById = vi.fn();
const insertMeditationComment = vi.fn();
const listMeditationComments = vi.fn();
const getMeditationCommentById = vi.fn();
const deleteMeditationComment = vi.fn();

vi.mock("./db", () => ({
  deleteMeditationComment: (...args: unknown[]) => deleteMeditationComment(...args),
  deleteMediaFile: vi.fn(),
  deleteDailyMeditation: vi.fn(),
  getDailyMeditationByDate: vi.fn(),
  getDailyMeditationById: (...args: unknown[]) => getDailyMeditationById(...args),
  getMeditationCommentById: (...args: unknown[]) => getMeditationCommentById(...args),
  insertContactMessage: vi.fn(),
  insertDailyMeditation: vi.fn(),
  insertMeditationComment: (...args: unknown[]) => insertMeditationComment(...args),
  insertMediaFile: vi.fn(),
  listContactMessages: vi.fn(),
  listDailyMeditations: vi.fn(),
  listMeditationComments: (...args: unknown[]) => listMeditationComments(...args),
  listMediaFiles: vi.fn(),
  listNewsletterSubscribers: vi.fn(),
  subscribeToNewsletter: vi.fn(),
  updateDailyMeditation: vi.fn(),
}));

const { appRouter } = await import("./routers");

function makeContext(role?: "user" | "admin", id = 1): TrpcContext {
  const user = role
    ? {
        id,
        openId: `member-${id}`,
        email: `member-${id}@example.com`,
        name: `Member ${id}`,
        loginMethod: "manus",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: { protocol: "https", headers: {} },
    res: { clearCookie: vi.fn(), cookie: vi.fn() },
  } as unknown as TrpcContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("meditation.comments", () => {
  it("allows visitors to read shared reflections", async () => {
    listMeditationComments.mockResolvedValue([
      { id: 7, meditationId: 3, authorName: "Grace Kim", content: "은혜를 나눕니다." },
    ]);

    const rows = await appRouter.createCaller(makeContext()).meditation.comments.list({ meditationId: 3 });

    expect(rows).toHaveLength(1);
    expect(listMeditationComments).toHaveBeenCalledWith(3);
  });

  it("requires a logged-in member to write a reflection", async () => {
    const caller = appRouter.createCaller(makeContext());

    await expect(
      caller.meditation.comments.create({ meditationId: 3, content: "말씀을 묵상합니다." }),
    ).rejects.toThrow();
    expect(insertMeditationComment).not.toHaveBeenCalled();
  });

  it("stores a trimmed reflection for an existing meditation", async () => {
    getDailyMeditationById.mockResolvedValue({ id: 3, meditationDate: "2026-08-10" });
    insertMeditationComment.mockResolvedValue({ insertId: 7 });

    const result = await appRouter
      .createCaller(makeContext("user", 4))
      .meditation.comments.create({ meditationId: 3, content: "  말씀을 통해 큰 위로를 받았습니다.  " });

    expect(result).toEqual({ success: true });
    expect(insertMeditationComment).toHaveBeenCalledWith({
      meditationId: 3,
      authorId: 4,
      content: "말씀을 통해 큰 위로를 받았습니다.",
    });
  });

  it("does not create a comment for a missing meditation", async () => {
    getDailyMeditationById.mockResolvedValue(null);

    await expect(
      appRouter
        .createCaller(makeContext("user"))
        .meditation.comments.create({ meditationId: 999, content: "묵상 나눔" }),
    ).rejects.toThrow();
    expect(insertMeditationComment).not.toHaveBeenCalled();
  });

  it("prevents a member from deleting someone else's reflection", async () => {
    getMeditationCommentById.mockResolvedValue({ id: 7, authorId: 9 });

    await expect(
      appRouter.createCaller(makeContext("user", 4)).meditation.comments.delete({ id: 7 }),
    ).rejects.toThrow();
    expect(deleteMeditationComment).not.toHaveBeenCalled();
  });

  it("allows administrators to moderate any reflection", async () => {
    getMeditationCommentById.mockResolvedValue({ id: 7, authorId: 9 });

    const result = await appRouter.createCaller(makeContext("admin", 1)).meditation.comments.delete({ id: 7 });

    expect(result).toEqual({ success: true });
    expect(deleteMeditationComment).toHaveBeenCalledWith(7);
  });
});
