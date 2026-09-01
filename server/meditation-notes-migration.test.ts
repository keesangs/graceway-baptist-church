import { describe, expect, it } from "vitest";
import { clearQtBrowserCopies, EMPTY_QT_ANSWERS, isPersonalNoteQueryEnabled, resolveQtAnswersForAccount, shouldSchedulePersonalNoteSave } from "../client/src/lib/meditationNotes";

describe("personal meditation note migration", () => {
  it("copies a meaningful legacy browser note only when no account note exists", () => {
    const legacyAnswers = {
      q1: "하나님은 신실하십니다.",
      q2: "오늘 순종합니다.",
      q3: "여호수아 14:12",
    };

    expect(resolveQtAnswersForAccount(null, legacyAnswers)).toEqual({
      answers: legacyAnswers,
      shouldPersist: true,
      source: "browser",
    });
  });

  it("keeps an empty legacy browser note local until a member writes an answer", () => {
    expect(resolveQtAnswersForAccount(undefined, EMPTY_QT_ANSWERS)).toEqual({
      answers: EMPTY_QT_ANSWERS,
      shouldPersist: false,
      source: "browser",
    });
  });

  it("prefers an existing account record over an older browser copy", () => {
    expect(
      resolveQtAnswersForAccount(
        { questionOne: "계정 기록", questionTwo: "", questionThree: "" },
        { q1: "이전 브라우저 기록", q2: "", q3: "" },
      ),
    ).toEqual({
      answers: { q1: "계정 기록", q2: "", q3: "" },
      shouldPersist: false,
      source: "account",
    });
  });

  it("queues the same answers for a retry after an error has been reset", () => {
    expect(shouldSchedulePersonalNoteSave({
      isAuthenticated: true,
      meditationId: 7,
      shouldPersist: true,
      isPending: false,
      isError: true,
    })).toBe(false);

    expect(shouldSchedulePersonalNoteSave({
      isAuthenticated: true,
      meditationId: 7,
      shouldPersist: true,
      isPending: false,
      isError: false,
    })).toBe(true);
  });

  it("clears only private QT browser copies when the member signs out", () => {
    const entries = new Map<string, string>([
      ["qt_2026-08-31", "private reflection"],
      ["qt_2026-09-01", "private reflection"],
      ["theme", "light"],
    ]);
    const storage = {
      get length() { return entries.size; },
      key(index: number) { return Array.from(entries.keys())[index] ?? null; },
      removeItem(key: string) { entries.delete(key); },
    };

    clearQtBrowserCopies(storage);

    expect(Array.from(entries.entries())).toEqual([["theme", "light"]]);
  });

  it("disables private note queries and scheduled saves after logout", () => {
    expect(isPersonalNoteQueryEnabled({ isAuthenticated: false, meditationId: 7 })).toBe(false);
    expect(shouldSchedulePersonalNoteSave({
      isAuthenticated: false,
      meditationId: 7,
      shouldPersist: true,
      isPending: false,
      isError: false,
    })).toBe(false);
  });
});
