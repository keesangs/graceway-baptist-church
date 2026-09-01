import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getDailyMeditationById: vi.fn(),
  getMeditationNoteForUser: vi.fn(),
  upsertMeditationNote: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    ...dbMocks,
  };
});

import { appRouter } from "./routers";

const meditation = { id: 7, meditationDate: "2026-08-30" };
const signedInContext = { user: { id: 42, role: "user" } } as never;
const secondSessionForSameMember = { user: { id: 42, role: "user" } } as never;
const differentMemberContext = { user: { id: 73, role: "user" } } as never;
const guestContext = { user: null } as never;

describe("meditation personal notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getDailyMeditationById.mockResolvedValue(meditation);
  });

  it("returns only the signed-in member's private note", async () => {
    const privateNote = {
      id: 3,
      meditationId: 7,
      userId: 42,
      questionOne: "하나님은 신실하십니다.",
      questionTwo: "말씀을 의지합니다.",
      questionThree: "여호수아 14:12",
    };
    dbMocks.getMeditationNoteForUser.mockResolvedValue(privateNote);

    await expect(
      appRouter.createCaller(signedInContext).meditation.notes.get({ meditationId: 7 }),
    ).resolves.toEqual(privateNote);

    expect(dbMocks.getMeditationNoteForUser).toHaveBeenCalledWith(7, 42);
  });

  it("reads the same private account note in a separate session for the same member", async () => {
    const privateNote = { id: 3, meditationId: 7, userId: 42, questionOne: "동일 계정 기록" };
    dbMocks.getMeditationNoteForUser.mockResolvedValue(privateNote);

    await expect(
      appRouter.createCaller(signedInContext).meditation.notes.get({ meditationId: 7 }),
    ).resolves.toEqual(privateNote);
    await expect(
      appRouter.createCaller(secondSessionForSameMember).meditation.notes.get({ meditationId: 7 }),
    ).resolves.toEqual(privateNote);

    expect(dbMocks.getMeditationNoteForUser).toHaveBeenNthCalledWith(1, 7, 42);
    expect(dbMocks.getMeditationNoteForUser).toHaveBeenNthCalledWith(2, 7, 42);
  });

  it("scopes a different member's request to that member's own account", async () => {
    dbMocks.getMeditationNoteForUser.mockResolvedValue(null);

    await expect(
      appRouter.createCaller(differentMemberContext).meditation.notes.get({ meditationId: 7 }),
    ).resolves.toBeNull();

    expect(dbMocks.getMeditationNoteForUser).toHaveBeenCalledWith(7, 73);
  });

  it("upserts every QT answer under the signed-in member's own user id", async () => {
    dbMocks.upsertMeditationNote.mockResolvedValue({ id: 3, meditationId: 7, userId: 42 });

    await expect(
      appRouter.createCaller(signedInContext).meditation.notes.upsert({
        meditationId: 7,
        questionOne: "하나님은 신실하십니다.",
        questionTwo: "오늘 순종합니다.",
        questionThree: "여호수아 14:12",
      }),
    ).resolves.toMatchObject({ id: 3, meditationId: 7, userId: 42 });

    expect(dbMocks.upsertMeditationNote).toHaveBeenCalledWith({
      meditationId: 7,
      questionOne: "하나님은 신실하십니다.",
      questionTwo: "오늘 순종합니다.",
      questionThree: "여호수아 14:12",
      userId: 42,
    });
  });

  it("accepts the same private note payload when a member retries after a transient save failure", async () => {
    const input = {
      meditationId: 7,
      questionOne: "하나님은 신실하십니다.",
      questionTwo: "오늘 순종합니다.",
      questionThree: "여호수아 14:12",
    };
    dbMocks.upsertMeditationNote
      .mockRejectedValueOnce(new Error("Temporary database interruption"))
      .mockResolvedValueOnce({ id: 3, ...input, userId: 42 });

    await expect(
      appRouter.createCaller(signedInContext).meditation.notes.upsert(input),
    ).rejects.toThrow("Temporary database interruption");
    await expect(
      appRouter.createCaller(signedInContext).meditation.notes.upsert(input),
    ).resolves.toMatchObject({ id: 3, userId: 42, ...input });

    expect(dbMocks.upsertMeditationNote).toHaveBeenNthCalledWith(1, { ...input, userId: 42 });
    expect(dbMocks.upsertMeditationNote).toHaveBeenNthCalledWith(2, { ...input, userId: 42 });
  });

  it("rejects guests before private notes can be read or written", async () => {
    await expect(
      appRouter.createCaller(guestContext).meditation.notes.get({ meditationId: 7 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      appRouter.createCaller(guestContext).meditation.notes.upsert({
        meditationId: 7,
        questionOne: "",
        questionTwo: "",
        questionThree: "",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    expect(dbMocks.getMeditationNoteForUser).not.toHaveBeenCalled();
    expect(dbMocks.upsertMeditationNote).not.toHaveBeenCalled();
  });

  it("does not create a note for an unknown meditation", async () => {
    dbMocks.getDailyMeditationById.mockResolvedValue(null);

    await expect(
      appRouter.createCaller(signedInContext).meditation.notes.upsert({
        meditationId: 999,
        questionOne: "답변",
        questionTwo: "답변",
        questionThree: "답변",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(dbMocks.upsertMeditationNote).not.toHaveBeenCalled();
  });
});
