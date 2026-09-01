// @vitest-environment jsdom
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PersonalNoteRetryButton } from "../client/src/components/PersonalNoteRetryButton";
import { retryPersonalNoteSave, type PersonalNoteSaveInput } from "../client/src/lib/meditationNotes";

describe("meditation note retry button", () => {
  it("retries the identical note after a failed save when a member clicks 다시 저장", async () => {
    const input: PersonalNoteSaveInput = {
      meditationId: 7,
      questionOne: "하나님은 신실하십니다.",
      questionTwo: "오늘 순종합니다.",
      questionThree: "여호수아 14:12",
    };
    const saveAttempt = vi.fn()
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValueOnce({ id: 3, ...input });
    const reset = vi.fn();
    await expect(saveAttempt(input)).rejects.toThrow("Temporary failure");

    const user = userEvent.setup();
    render(createElement(PersonalNoteRetryButton, {
      lang: "ko",
      onRetry: () => retryPersonalNoteSave({
        input,
        reset,
        mutate: (retryInput) => { void saveAttempt(retryInput); },
      }),
    }));

    await user.click(screen.getByRole("button", { name: "다시 저장" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(saveAttempt).toHaveBeenNthCalledWith(1, input);
    expect(saveAttempt).toHaveBeenNthCalledWith(2, input);
  });
});
