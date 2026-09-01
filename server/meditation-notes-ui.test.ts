import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const meditationPage = readFileSync(
  resolve(process.cwd(), "client/src/pages/Meditation.tsx"),
  "utf8",
);

describe("meditation personal notes UI", () => {
  it("uses authenticated tRPC notes with a private account-save status", () => {
    expect(meditationPage).toContain("trpc.meditation.notes.get.useQuery");
    expect(meditationPage).toContain("trpc.meditation.notes.upsert.useMutation");
    expect(meditationPage).toContain("내 계정에 비공개로 자동 저장됩니다");
    expect(meditationPage).toContain("다른 기기에서도 같은 계정으로 볼 수 있습니다");
    expect(meditationPage).toContain("retryPersonalNoteSave");
    expect(meditationPage).toContain("PersonalNoteRetryButton");
    expect(meditationPage).toContain("handleMeditationLogout");
    expect(meditationPage).toContain("clearQtBrowserCopies");
    expect(meditationPage).toContain("로그아웃");
  });

  it("keeps a defensive browser fallback and migrates an existing local note only after sign-in", () => {
    expect(meditationPage).toContain("readLocalQtAnswers");
    expect(meditationPage).toContain("resolveQtAnswersForAccount");
    expect(meditationPage).toContain("shouldSchedulePersonalNoteSave");
    expect(meditationPage).toContain("legacy browser-only note");
    expect(meditationPage).toContain("isAuthenticated && currentMeditation?.id");
  });
});
