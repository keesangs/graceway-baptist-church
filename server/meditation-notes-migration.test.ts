import { describe, expect, it } from "vitest";
import { EMPTY_QT_ANSWERS, resolveQtAnswersForAccount, shouldSchedulePersonalNoteSave } from "../client/src/lib/meditationNotes";

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
});
