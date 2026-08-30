import { describe, expect, it } from "vitest";
import { getSermonDateTimestamp, getSermonMetadataLines } from "../client/src/lib/sermonDisplay";

describe("sermon card metadata display", () => {
  const latestSermon = {
    date: "August 23, 2026",
    title: "Jesus, Not a Miracle",
    titleKo: "기적이 아니라 예수입니다",
    scripture: "사도행전 3장 1절 ~ 16절",
    scriptureEn: "Acts 3:1–16",
  };

  it("formats the requested Korean date, title, and scripture lines", () => {
    expect(getSermonMetadataLines(latestSermon, "ko")).toEqual({
      date: "2026. 08.23 주일예배 말씀",
      title: "기적이 아니라 예수입니다",
      scripture: "본문: 사도행전 3장 1절 ~ 16절",
    });
  });

  it("derives the actual Sunday from a synced playlist title rather than its upload timestamp", () => {
    expect(getSermonDateTimestamp("2026. 08.23 주일예배 말씀", "2026-08-26T02:51:54.000Z"))
      .toBe(Date.UTC(2026, 7, 23));
  });
});
