// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DailyMeditation } from "../drizzle/schema";
import { getMeditationPrayerBody } from "../client/src/lib/meditationPrayer";

const mocks = vi.hoisted(() => ({
  lang: "ko", user: null as null | { id: number; role: string },
  rows: [] as DailyMeditation[], loading: false,
  mutate: vi.fn(), create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined), invalidate: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({
  user: mocks.user, isAuthenticated: Boolean(mocks.user), loading: false, logout: vi.fn(),
}) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLang: () => ({ lang: mocks.lang }) }));
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/BrandAbstractVisual", () => ({ BrandAbstractVisual: () => null }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  useUtils: () => ({ meditation: {
    notes: { get: { invalidate: mocks.invalidate } },
    comments: { list: { invalidate: mocks.invalidate } },
    likeStatus: { invalidate: mocks.invalidate }, list: { invalidate: mocks.invalidate },
  } }),
  meditation: {
    list: { useQuery: () => ({ data: mocks.rows, isLoading: mocks.loading, refetch: mocks.refetch }) },
    create: { useMutation: () => ({ isPending: false, mutateAsync: mocks.create }) },
    update: { useMutation: (options: { onSuccess: () => void }) => ({ isPending: false,
      mutateAsync: async (input: unknown) => { await mocks.update(input); options.onSuccess(); },
    }) },
    delete: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) },
    notes: {
      get: { useQuery: () => ({ data: null, isSuccess: true, isLoading: false }) },
      upsert: { useMutation: () => ({ isPending: false, isError: false, reset: vi.fn(), mutate: mocks.mutate }) },
    },
    likeStatus: { useQuery: () => ({ data: { likeCount: 0, hasLiked: false }, isLoading: false }) },
    toggleLike: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) },
    comments: {
      list: { useQuery: () => ({ data: { items: [], total: 0, nextOffset: null }, isLoading: false }) },
      create: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) },
      delete: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) },
      toggleLike: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) },
    },
  },
} }));
import Meditation from "../client/src/pages/Meditation";
import AdminDailyBible from "../client/src/pages/AdminDailyBible";

const body = "주님, 저를 붙들어 주셔서 감사합니다.\n\n받은 위로를 이웃에게 흘려 보내게 하소서.";
function row(overrides: Partial<DailyMeditation> = {}): DailyMeditation {
  return {
    id: 7, meditationDate: "2026-11-20", scriptureReference: "고린도후서 1:1–7",
    scriptureReferenceEn: null, scriptureText: "1:1 성경 본문 첫 구절\n1:7 성경 본문 마지막 구절",
    scriptureTextEn: null, title: "환난보다 큰 하나님의 위로", titleEn: null,
    content: "오늘의 기도 — " + body, contentEn: null, authorId: 1, likeCount: 0,
    createdAt: new Date(), updatedAt: new Date(), ...overrides,
  };
}
beforeEach(() => {
  vi.clearAllMocks(); vi.setSystemTime(new Date("2026-11-20T10:00:00Z"));
  localStorage.clear(); mocks.lang = "ko"; mocks.user = null; mocks.loading = false; mocks.rows = [row()];
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("existing prayer text presentation", () => {
  it.each([
    ["오늘의 기도 — " + body, body], ["오늘의 기도\r\n" + body, body],
    ["오늘의 기도: " + body, body], ["Today's Prayer — Lord, guide us.", "Lord, guide us."],
    ["Today’s Prayer\nLord, guide us.", "Lord, guide us."],
    ["오늘의 기도는 마음에서 시작됩니다.", "오늘의 기도는 마음에서 시작됩니다."],
    ["Lord, help us. Today's Prayer is precious.", "Lord, help us. Today's Prayer is precious."],
  ])("removes only a recognized leading label without changing prayer wording", (input, expected) => {
    expect(getMeditationPrayerBody(input)).toBe(expected);
  });

  it("renders saved prayer for guests immediately after Scripture and before Sharing", () => {
    const { container } = render(createElement(Meditation));
    const prayer = screen.getByRole("region", { name: "오늘의 기도" });
    const text = prayer.querySelector("p")!;
    expect(text.textContent).toBe(body);
    expect(text.className).toContain("whitespace-pre-wrap");
    expect(text.className).toContain("overflow-wrap:anywhere");
    expect(text.lang).toBe("ko");
    expect(prayer.previousElementSibling?.textContent).toContain("성경 본문 마지막 구절");
    expect(prayer.nextElementSibling).toBe(screen.getByRole("region", { name: "묵상 나눔" }));
    expect(screen.getAllByRole("heading", { name: "오늘의 기도" })).toHaveLength(1);
    expect(container.querySelectorAll("#meditation-prayer-title")).toHaveLength(1);
    expect(mocks.rows[0].content).toBe("오늘의 기도 — " + body);
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it.each(["", " \n\t ", "오늘의 기도", "오늘의 기도 — "])("hides empty prayer rather than inventing content", content => {
    mocks.rows = [row({ content })]; render(createElement(Meditation));
    expect(screen.queryByRole("region", { name: "오늘의 기도" })).toBeNull();
    expect(screen.getByRole("region", { name: "묵상 나눔" })).toBeTruthy();
  });

  it("shows English prayer with a fully localized entry", () => {
    mocks.lang = "en";
    mocks.rows = [row({ scriptureReferenceEn: "2 Corinthians 1:1–7", scriptureTextEn: "1:1 English Scripture",
      titleEn: "God's comfort", contentEn: "Today's Prayer\nLord, guide us.\n\nAmen." })];
    render(createElement(Meditation));
    const prayer = screen.getByRole("region", { name: "Today's Prayer" });
    expect(prayer.querySelector("p")?.textContent).toBe("Lord, guide us.\n\nAmen.");
    expect(prayer.querySelector("p")?.lang).toBe("en");
    expect(prayer.nextElementSibling).toBe(screen.getByRole("region", { name: "Meditation Sharing" }));
    expect(screen.queryByText(body)).toBeNull();
  });

  it("retains Korean prayer with the existing untranslated-entry notice in English mode", () => {
    mocks.lang = "en"; render(createElement(Meditation));
    expect(screen.getByRole("region", { name: "Today's Prayer" }).querySelector("p")?.textContent).toBe(body);
    expect(screen.getByText(/This entry is currently available in Korean only/)).toBeTruthy();
  });

  it("renders markup literally and never executes stored HTML", () => {
    const unsafe = '<img src=x onerror="alert(1)"><script>alert(1)</script>';
    mocks.rows = [row({ content: unsafe })]; render(createElement(Meditation));
    const prayer = screen.getByRole("region", { name: "오늘의 기도" });
    expect(prayer.querySelector("p")?.textContent).toBe(unsafe);
    expect(prayer.querySelector("img,script")).toBeNull();
  });

  it("selects the prayer for the navigated date rather than keeping today's text", () => {
    mocks.rows.push(row({ id: 8, meditationDate: "2026-11-19", content: "어제의 기도 본문" }));
    render(createElement(Meditation)); fireEvent.click(screen.getByRole("button", { name: "이전 묵상" }));
    expect(screen.getByRole("region", { name: "오늘의 기도" }).querySelector("p")?.textContent).toBe("어제의 기도 본문");
  });

  it("does not show a prayer section for an unpublished day or during loading", () => {
    mocks.rows = []; const { rerender } = render(createElement(Meditation));
    expect(screen.queryByRole("region", { name: "오늘의 기도" })).toBeNull();
    mocks.loading = true; rerender(createElement(Meditation));
    expect(screen.getByText("로딩 중...")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "오늘의 기도" })).toBeNull();
  });

  it("admin guidance retains content field names and sends the original prayer unchanged", async () => {
    mocks.user = { id: 1, role: "admin" }; render(createElement(AdminDailyBible));
    fireEvent.click(screen.getByRole("button", { name: "환난보다 큰 하나님의 위로 수정" }));
    const input = screen.getByLabelText("묵상 내용") as HTMLTextAreaElement;
    expect(input.name).toBe("content"); expect(input.value).toBe("오늘의 기도 — " + body);
    expect(input.getAttribute("aria-describedby")).toBe("admin-content-help");
    expect(screen.getByText(/이 내용은 묵상페이지의 성경 본문 다음/)).toBeTruthy();
    expect((screen.getByLabelText("Today's Prayer (English)") as HTMLTextAreaElement).name).toBe("contentEn");
    fireEvent.click(screen.getByRole("button", { name: "수정", exact: true }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ id: 7, content: "오늘의 기도 — " + body, contentEn: null })));
    expect(mocks.create).not.toHaveBeenCalled();
    await waitFor(() => expect(mocks.invalidate).toHaveBeenCalledTimes(1));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });
});
