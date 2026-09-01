// @vitest-environment jsdom
import { createElement } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
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
            isError: false,
            reset: vi.fn(),
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

describe("meditation note localStorage migration flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const date = new Date().toISOString().split("T")[0];
    localStorage.setItem(`qt_${date}`, JSON.stringify({
      q1: "이전 기기의 브라우저 기록",
      q2: "말씀을 묵상합니다.",
      q3: "요한복음 3:16",
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("copies a legacy browser-only note into the first private account upsert after sign-in", async () => {
    render(createElement(Meditation));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(650);
    });

    expect(mocks.mutate).toHaveBeenCalledWith({
      meditationId: 7,
      questionOne: "이전 기기의 브라우저 기록",
      questionTwo: "말씀을 묵상합니다.",
      questionThree: "요한복음 3:16",
    });
  });
});
