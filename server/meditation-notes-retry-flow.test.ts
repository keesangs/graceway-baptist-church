// @vitest-environment jsdom
import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reset: vi.fn(),
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 42, role: "user" }, isAuthenticated: true }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLang: () => ({ lang: "ko" }),
}));

vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/BrandAbstractVisual", () => ({ BrandAbstractVisual: () => null }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      meditation: {
        notes: { get: { invalidate: mocks.invalidate } },
        comments: { list: { invalidate: mocks.invalidate } },
        likeStatus: { invalidate: mocks.invalidate },
        list: { invalidate: mocks.invalidate },
      },
    }),
    meditation: {
      list: {
        useQuery: () => ({
          data: [{
            id: 7,
            meditationDate: new Date().toISOString().split("T")[0],
            scriptureReference: "요한복음 3:16",
            scriptureText: "3:16 하나님이 세상을 이처럼 사랑하사",
            title: "하나님의 사랑",
            content: "",
          }],
          isLoading: false,
        }),
      },
      notes: {
        get: { useQuery: () => ({ data: null, isLoading: false, isSuccess: true }) },
        upsert: {
          useMutation: () => ({
            isPending: false,
            isError: true,
            reset: mocks.reset,
            mutate: mocks.mutate,
          }),
        },
      },
      likeStatus: { useQuery: () => ({ data: { likeCount: 0, hasLiked: false }, isLoading: false }) },
      comments: {
        list: { useQuery: () => ({ data: { items: [], total: 0, nextOffset: null }, isLoading: false, isFetching: false }) },
        create: { useMutation: () => ({ isPending: false, isError: false, mutate: vi.fn() }) },
        delete: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        toggleLike: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      },
      toggleLike: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

import Meditation from "../client/src/pages/Meditation";

describe("meditation note retry flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const date = new Date().toISOString().split("T")[0];
    localStorage.setItem(`qt_${date}`, JSON.stringify({
      q1: "동일한 답변으로 다시 저장합니다.",
      q2: "",
      q3: "",
    }));
  });

  it("resets a failed save and retries the same answer from the error-state control", async () => {
    const user = userEvent.setup();
    render(createElement(Meditation));

    await waitFor(() => {
      const questionOne = screen.getByLabelText("1. 하나님은 어떤 분?") as HTMLTextAreaElement;
      expect(questionOne.value).toBe("동일한 답변으로 다시 저장합니다.");
    });

    await user.click(screen.getByRole("button", { name: "다시 저장" }));

    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(mocks.mutate).toHaveBeenCalledWith({
      meditationId: 7,
      questionOne: "동일한 답변으로 다시 저장합니다.",
      questionTwo: "",
      questionThree: "",
    });
  });
});
