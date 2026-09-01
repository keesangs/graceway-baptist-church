export type QtAnswers = { q1: string; q2: string; q3: string };

export type StoredMeditationNote = {
  questionOne: string;
  questionTwo: string;
  questionThree: string;
};

export const EMPTY_QT_ANSWERS: QtAnswers = { q1: "", q2: "", q3: "" };

export function hasQtAnswerContent(answers: QtAnswers) {
  return Object.values(answers).some((answer) => answer.trim().length > 0);
}

/**
 * The account record is authoritative once it exists. Until then, a prior
 * browser-only record is returned once so the caller can create the user's
 * first private server-side copy after they sign in.
 */
export function resolveQtAnswersForAccount(
  storedNote: StoredMeditationNote | null | undefined,
  browserAnswers: QtAnswers,
) {
  if (storedNote) {
    return {
      answers: {
        q1: storedNote.questionOne,
        q2: storedNote.questionTwo,
        q3: storedNote.questionThree,
      } satisfies QtAnswers,
      shouldPersist: false,
      source: "account" as const,
    };
  }

  return {
    answers: browserAnswers,
    shouldPersist: hasQtAnswerContent(browserAnswers),
    source: "browser" as const,
  };
}

/** True only when a signed-in member has a valid note ready for a save attempt. */
export function shouldSchedulePersonalNoteSave({
  isAuthenticated,
  meditationId,
  shouldPersist,
  isPending,
  isError,
}: {
  isAuthenticated: boolean;
  meditationId?: number;
  shouldPersist: boolean;
  isPending: boolean;
  isError: boolean;
}) {
  return Boolean(isAuthenticated && meditationId && shouldPersist && !isPending && !isError);
}

export type PersonalNoteSaveInput = {
  meditationId: number;
  questionOne: string;
  questionTwo: string;
  questionThree: string;
};

/** Reset a failed mutation and immediately retry the exact same private note. */
export function retryPersonalNoteSave({
  input,
  reset,
  mutate,
}: {
  input: PersonalNoteSaveInput;
  reset: () => void;
  mutate: (input: PersonalNoteSaveInput) => void;
}) {
  reset();
  mutate(input);
}
