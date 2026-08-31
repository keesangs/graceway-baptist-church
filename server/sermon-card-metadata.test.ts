import { describe, expect, it } from "vitest";
import { getCanonicalSermonCards, getSermonDateTimestamp, getSermonMetadataLines } from "../client/src/lib/sermonDisplay";

describe("sermon card metadata display", () => {
  const latestSermon = {
    date: "August 23, 2026",
    title: "Jesus, Not a Miracle",
    titleKo: "기적이 아니라 예수입니다",
    scripture: "사도행전 3장 1절 ~ 16절",
    scriptureEn: "Acts 3:1–16",
  };

  const augustThirtiethSermon = {
    date: "August 30, 2026",
    title: "The True Strength of My Life",
    titleKo: "내 인생의 진짜 힘",
    scripture: "여호수아 14장 6절 ~ 12절",
    scriptureEn: "Joshua 14:6–12",
  };

  it("formats the requested Korean date, title, and scripture lines", () => {
    expect(getSermonMetadataLines(latestSermon, "ko")).toEqual({
      date: "2026. 08.23 주일예배 말씀",
      title: "기적이 아니라 예수입니다",
      scripture: "본문: 사도행전 3장 1절 ~ 16절",
    });
  });

  it("uses the church-supplied August 30 title and scripture for the synchronized video", () => {
    const cards = getCanonicalSermonCards([
      {
        ...augustThirtiethSermon,
        speaker: "Pastor Hunsuk Lee",
        duration: "New",
        series: "Sunday Sermon",
        videoId: "12P388oQ630",
      },
    ], [
      {
        videoId: "12P388oQ630",
        title: "2026. 08.30 주일예배 말씀",
        publishedAt: "2026-08-31T05:41:54.000Z",
        thumbnailUrl: "https://example.com/aug-30.jpg",
        playlistPosition: 0,
      },
    ]);

    expect(getSermonMetadataLines(cards[0], "ko")).toEqual({
      date: "2026. 08.30 주일예배 말씀",
      title: "내 인생의 진짜 힘",
      scripture: "본문: 여호수아 14장 6절 ~ 12절",
    });
  });

  it("derives the actual Sunday from a synced playlist title rather than its upload timestamp", () => {
    expect(getSermonDateTimestamp("2026. 08.23 주일예배 말씀", "2026-08-26T02:51:54.000Z"))
      .toBe(Date.UTC(2026, 7, 23));
  });

  it("uses a curated English service date instead of the later YouTube upload timestamp", () => {
    expect(getSermonDateTimestamp("August 2, 2026", "2026-08-03T06:05:00.000Z"))
      .toBe(new Date("August 2, 2026").getTime());
  });

  it("keeps a curated Sunday message when a second source video has the same service date", () => {
    const legacy = [{
      ...latestSermon,
      speaker: "Pastor Hunsuk Lee",
      duration: "New",
      series: "Sunday Sermon",
      videoId: "JRYyUcCiMbM",
    }];
    const cards = getCanonicalSermonCards(legacy, [
      {
        videoId: "12P388oQ630",
        title: "2026. 08.23 주일예배 설교",
        publishedAt: "2026-08-31T05:41:54.000Z",
        thumbnailUrl: "https://example.com/alternate.jpg",
        playlistPosition: 0,
      },
      {
        videoId: "JRYyUcCiMbM",
        title: "2026. 08.23 주일예배 말씀",
        publishedAt: "2026-08-26T02:51:54.000Z",
        thumbnailUrl: "https://example.com/message.jpg",
        playlistPosition: 1,
      },
    ]);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      videoId: "JRYyUcCiMbM",
      titleKo: "기적이 아니라 예수입니다",
      scripture: "사도행전 3장 1절 ~ 16절",
    });
  });

  it("keeps a genuinely new synchronized service as one fallback card and orders distinct Sundays", () => {
    const legacy = [
      {
        ...latestSermon,
        speaker: "Pastor Hunsuk Lee",
        duration: "New",
        series: "Sunday Sermon",
        videoId: "JRYyUcCiMbM",
      },
      {
        date: "August 16, 2026",
        title: "Filled with the Holy Spirit",
        titleKo: "성령으로 채우시다",
        scripture: "사도행전 2:22–36",
        scriptureEn: "Acts 2:22–36",
        speaker: "Pastor Hunsuk Lee",
        duration: "New",
        series: "Sunday Sermon",
        videoId: "8NchEyAy3jE",
      },
    ];
    const cards = getCanonicalSermonCards(legacy, [
      {
        videoId: "new-sermon",
        title: "2026. 08.30 주일예배 말씀",
        publishedAt: "2026-08-31T05:41:54.000Z",
        thumbnailUrl: "https://example.com/new.jpg",
        playlistPosition: 0,
      },
      {
        videoId: "JRYyUcCiMbM",
        title: "2026. 08.23 주일예배 말씀",
        publishedAt: "2026-08-26T02:51:54.000Z",
        thumbnailUrl: "https://example.com/aug-23.jpg",
        playlistPosition: 1,
      },
      {
        videoId: "qlKRFWwcHQo",
        title: "2026. 08.09 주일예배 말씀",
        publishedAt: "2026-08-10T07:38:36.000Z",
        thumbnailUrl: "https://example.com/aug-9.jpg",
        playlistPosition: 2,
      },
      {
        videoId: "jStg7ksuSdM",
        title: "2026. 08.02 주일예배 말씀",
        publishedAt: "2026-08-03T06:29:12.000Z",
        thumbnailUrl: "https://example.com/aug-2.jpg",
        playlistPosition: 3,
      },
    ]);

    expect(cards.map((card) => card.videoId)).toEqual([
      "new-sermon",
      "JRYyUcCiMbM",
      "8NchEyAy3jE",
      "qlKRFWwcHQo",
      "jStg7ksuSdM",
    ]);
    expect(cards[0]).toMatchObject({
      titleKo: "2026. 08.30 주일예배 말씀",
      scripture: "",
    });
  });
});
