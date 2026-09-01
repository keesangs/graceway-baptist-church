import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const getDailyMeditationById = vi.fn();
const getUserMeditationLike = vi.fn();
const insertDailyMeditation = vi.fn();
const insertMeditationComment = vi.fn();
const listMeditationComments = vi.fn();
const getMeditationCommentById = vi.fn();
const deleteMeditationComment = vi.fn();
const toggleMeditationLike = vi.fn();
const toggleMeditationCommentLike = vi.fn();

vi.mock("./db", () => ({
  deleteMeditationComment: (...args: unknown[]) => deleteMeditationComment(...args),
  deleteMediaFile: vi.fn(),
  deleteDailyMeditation: vi.fn(),
  getDailyMeditationByDate: vi.fn(),
  getDailyMeditationById: (...args: unknown[]) => getDailyMeditationById(...args),
  getUserMeditationLike: (...args: unknown[]) => getUserMeditationLike(...args),
  getMeditationCommentById: (...args: unknown[]) => getMeditationCommentById(...args),
  insertContactMessage: vi.fn(),
  insertDailyMeditation: (...args: unknown[]) => insertDailyMeditation(...args),
  insertMeditationComment: (...args: unknown[]) => insertMeditationComment(...args),
  insertMediaFile: vi.fn(),
  listContactMessages: vi.fn(),
  listDailyMeditations: vi.fn(),
  listMeditationComments: (...args: unknown[]) => listMeditationComments(...args),
  listMediaFiles: vi.fn(),
  listNewsletterSubscribers: vi.fn(),
  subscribeToNewsletter: vi.fn(),
  toggleMeditationLike: (...args: unknown[]) => toggleMeditationLike(...args),
  toggleMeditationCommentLike: (...args: unknown[]) => toggleMeditationCommentLike(...args),
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
  it("rejects Daily Bible writes from a signed-in non-admin member", async () => {
    const caller = appRouter.createCaller(makeContext("user", 11));

    await expect(
      caller.meditation.create({
        meditationDate: "2026-09-02",
        scriptureReference: "요한복음 3:16",
        scriptureText: "하나님이 세상을 이처럼 사랑하사",
        title: "하나님의 사랑",
        content: "복음의 은혜를 묵상합니다.",
      }),
    ).rejects.toThrow();

    expect(insertDailyMeditation).not.toHaveBeenCalled();
  });

  it("stores optional English Daily Bible fields for English-mode readers", async () => {
    insertDailyMeditation.mockResolvedValue({ insertId: 17 });

    await appRouter.createCaller(makeContext("admin", 9)).meditation.create({
      meditationDate: "2026-08-22",
      scriptureReference: "에스겔 44:15–31",
      scriptureText: "한국어 성경 본문",
      title: "거룩한 헌신",
      content: "한국어 묵상 내용",
      scriptureReferenceEn: "Ezekiel 44:15–31",
      scriptureTextEn: "Licensed English Scripture text",
      titleEn: "Holy Devotion",
      contentEn: "English meditation reflection",
    });

    expect(insertDailyMeditation).toHaveBeenCalledWith({
      meditationDate: "2026-08-22",
      scriptureReference: "에스겔 44:15–31",
      scriptureReferenceEn: "Ezekiel 44:15–31",
      scriptureText: "한국어 성경 본문",
      scriptureTextEn: "Licensed English Scripture text",
      title: "거룩한 헌신",
      titleEn: "Holy Devotion",
      content: "한국어 묵상 내용",
      contentEn: "English meditation reflection",
      authorId: 9,
    });
  });

  it("allows visitors to read shared reflections", async () => {
    listMeditationComments.mockResolvedValue({
      items: [{ id: 7, meditationId: 3, authorName: "Grace Kim", content: "은혜를 나눕니다." }],
      total: 12,
      nextOffset: 10,
    });

    const rows = await appRouter.createCaller(makeContext()).meditation.comments.list({ meditationId: 3 });

    expect(rows).toMatchObject({ total: 12, nextOffset: 10 });
    expect(listMeditationComments).toHaveBeenCalledWith(3, undefined, 10, 0);
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
      parentCommentId: null,
      authorId: 4,
      content: "말씀을 통해 큰 위로를 받았습니다.",
    });
  });

  it("stores a reply only under a top-level reflection in the same meditation", async () => {
    getDailyMeditationById.mockResolvedValue({ id: 3, meditationDate: "2026-08-10" });
    getMeditationCommentById.mockResolvedValue({ id: 7, meditationId: 3, parentCommentId: null });
    insertMeditationComment.mockResolvedValue({ insertId: 8 });

    await appRouter
      .createCaller(makeContext("user", 4))
      .meditation.comments.create({ meditationId: 3, parentCommentId: 7, content: "함께 은혜를 받았습니다." });

    expect(insertMeditationComment).toHaveBeenCalledWith({
      meditationId: 3,
      parentCommentId: 7,
      authorId: 4,
      content: "함께 은혜를 받았습니다.",
    });
  });

  it("rejects replies to a reply so threads remain one level deep", async () => {
    getDailyMeditationById.mockResolvedValue({ id: 3, meditationDate: "2026-08-10" });
    getMeditationCommentById.mockResolvedValue({ id: 8, meditationId: 3, parentCommentId: 7 });

    await expect(
      appRouter
        .createCaller(makeContext("user", 4))
        .meditation.comments.create({ meditationId: 3, parentCommentId: 8, content: "중첩 답글" }),
    ).rejects.toThrow();
    expect(insertMeditationComment).not.toHaveBeenCalled();
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

  it("requires sign-in before a member can react to a reflection", async () => {
    await expect(appRouter.createCaller(makeContext()).meditation.comments.toggleLike({ id: 7 })).rejects.toThrow();
    expect(toggleMeditationCommentLike).not.toHaveBeenCalled();
  });

  it("toggles one member reaction on an existing reflection", async () => {
    getMeditationCommentById.mockResolvedValue({ id: 7, authorId: 9 });
    toggleMeditationCommentLike.mockResolvedValue(true);

    const result = await appRouter.createCaller(makeContext("user", 4)).meditation.comments.toggleLike({ id: 7 });

    expect(result).toEqual({ liked: true });
    expect(toggleMeditationCommentLike).toHaveBeenCalledWith(7, 4);
  });
});

describe("meditation.likes", () => {
  it("shows the aggregate count and anonymous state for every visitor", async () => {
    getDailyMeditationById.mockResolvedValue({ id: 4, likeCount: 2 });

    const result = await appRouter.createCaller(makeContext()).meditation.likeStatus({ meditationId: 4 });

    expect(result).toEqual({ likeCount: 2, hasLiked: false });
    expect(getUserMeditationLike).not.toHaveBeenCalled();
  });

  it("shows a member's existing state and toggles that member's selected meditation", async () => {
    getDailyMeditationById.mockResolvedValue({ id: 4, likeCount: 2 });
    getUserMeditationLike.mockResolvedValue({ id: 17, meditationId: 4, userId: 4 });
    toggleMeditationLike.mockResolvedValue(true);
    const caller = appRouter.createCaller(makeContext("user", 4));

    await expect(caller.meditation.likeStatus({ meditationId: 4 })).resolves.toEqual({ likeCount: 2, hasLiked: true });
    await expect(caller.meditation.toggleLike({ meditationId: 4 })).resolves.toEqual({ liked: true });
    expect(toggleMeditationLike).toHaveBeenCalledWith(4, 4);
  });

  it("rejects anonymous attempts to toggle a meditation like", async () => {
    await expect(appRouter.createCaller(makeContext()).meditation.toggleLike({ meditationId: 4 })).rejects.toThrow();
    expect(toggleMeditationLike).not.toHaveBeenCalled();
  });
});
