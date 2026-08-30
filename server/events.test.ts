import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { expandCalendarEventOccurrences, getFeaturedSpecialCalendarEventOccurrence, getUpcomingCalendarEventOccurrences } from "./eventOccurrences";

const createCalendarEvent = vi.fn();
const createPhotoAlbum = vi.fn();
const deleteCalendarEvent = vi.fn();
const deleteGalleryPhoto = vi.fn();
const deletePhotoAlbum = vi.fn();
const getCalendarEventById = vi.fn();
const getGalleryPhotoById = vi.fn();
const getPhotoAlbumById = vi.fn();
const getPublishedPhotoAlbum = vi.fn();
const listCalendarEvents = vi.fn();
const listGalleryPhotosForAdmin = vi.fn();
const listPublishedCalendarEvents = vi.fn();
const listPublishedPhotoAlbums = vi.fn();
const updateCalendarEvent = vi.fn();
const updateGalleryPhoto = vi.fn();
const updatePhotoAlbum = vi.fn();

vi.mock("./db", () => ({
  createCalendarEvent: (...args: unknown[]) => createCalendarEvent(...args),
  createGalleryPhoto: vi.fn(),
  createPhotoAlbum: (...args: unknown[]) => createPhotoAlbum(...args),
  deleteCalendarEvent: (...args: unknown[]) => deleteCalendarEvent(...args),
  deleteGalleryPhoto: (...args: unknown[]) => deleteGalleryPhoto(...args),
  deletePhotoAlbum: (...args: unknown[]) => deletePhotoAlbum(...args),
  deleteMeditationComment: vi.fn(),
  deleteMediaFile: vi.fn(),
  deleteDailyMeditation: vi.fn(),
  getCalendarEventById: (...args: unknown[]) => getCalendarEventById(...args),
  getGalleryPhotoById: (...args: unknown[]) => getGalleryPhotoById(...args),
  getPhotoAlbumById: (...args: unknown[]) => getPhotoAlbumById(...args),
  getPublishedPhotoAlbum: (...args: unknown[]) => getPublishedPhotoAlbum(...args),
  getDailyMeditationByDate: vi.fn(),
  getDailyMeditationById: vi.fn(),
  getMeditationCommentById: vi.fn(),
  insertContactMessage: vi.fn(),
  insertDailyMeditation: vi.fn(),
  insertMeditationComment: vi.fn(),
  insertMediaFile: vi.fn(),
  listCalendarEvents: (...args: unknown[]) => listCalendarEvents(...args),
  listContactMessages: vi.fn(),
  listDailyMeditations: vi.fn(),
  listGalleryPhotosForAdmin: (...args: unknown[]) => listGalleryPhotosForAdmin(...args),
  listMeditationComments: vi.fn(),
  listMediaFiles: vi.fn(),
  listNewsletterSubscribers: vi.fn(),
  listPublishedCalendarEvents: (...args: unknown[]) => listPublishedCalendarEvents(...args),
  listPublishedPhotoAlbums: (...args: unknown[]) => listPublishedPhotoAlbums(...args),
  listPhotoAlbumsForAdmin: vi.fn(),
  listYouTubeVideos: vi.fn(),
  saveYouTubePlaylistVideos: vi.fn(),
  subscribeToNewsletter: vi.fn(),
  toggleMeditationCommentLike: vi.fn(),
  updateCalendarEvent: (...args: unknown[]) => updateCalendarEvent(...args),
  updateDailyMeditation: vi.fn(),
  updateGalleryPhoto: (...args: unknown[]) => updateGalleryPhoto(...args),
  updatePhotoAlbum: (...args: unknown[]) => updatePhotoAlbum(...args),
}));

const { appRouter } = await import("./routers");

function makeContext(role?: "user" | "admin", id = 1): TrpcContext {
  const user = role
    ? { id, openId: `user-${id}`, email: `user-${id}@example.com`, name: "Church member", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }
    : null;
  return { user, req: { protocol: "https", headers: {} }, res: { clearCookie: vi.fn(), cookie: vi.fn() } } as unknown as TrpcContext;
}

const sundayWorship = {
  id: 12,
  titleKo: "주일 예배",
  titleEn: "Sunday Worship",
  startAt: new Date("2026-08-02T20:30:00.000Z"),
  endAt: new Date("2026-08-02T22:00:00.000Z"),
  allDay: 0,
  venueKo: "Graceway Baptist Church",
  venueEn: "Graceway Baptist Church",
  descriptionKo: null,
  descriptionEn: null,
  eventType: "worship" as const,
  status: "published" as const,
  recurrence: "weekly" as const,
  recurrenceUntil: new Date("2030-08-16T20:30:00.000Z"),
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe("event recurrence expansion", () => {
  it("expands only occurrences in range, retains duration, and observes inclusive weekly end", () => {
    const occurrences = expandCalendarEventOccurrences(
      [sundayWorship],
      new Date("2026-08-08T00:00:00.000Z"),
      new Date("2026-08-18T00:00:00.000Z"),
    );

    expect(occurrences.map(item => item.occurrenceStart.toISOString())).toEqual([
      "2026-08-09T20:30:00.000Z",
      "2026-08-16T20:30:00.000Z",
    ]);
    expect(occurrences[0]?.occurrenceEnd?.toISOString()).toBe("2026-08-09T22:00:00.000Z");
    expect(occurrences.every(item => item.seriesId === sundayWorship.id && item.isRecurring)).toBe(true);
  });

  it("returns the next occurrences in chronological order without persisting copies", () => {
    const result = getUpcomingCalendarEventOccurrences([sundayWorship], new Date("2026-08-08T00:00:00.000Z"), 1);
    expect(result).toHaveLength(1);
    expect(result[0]?.occurrenceStart.toISOString()).toBe("2026-08-09T20:30:00.000Z");
  });

  it("prioritizes the closest upcoming event marked as special", () => {
    const earlySpecial = { ...sundayWorship, id: 21, eventType: "special" as const, recurrence: "none" as const, startAt: new Date("2026-08-14T01:00:00.000Z"), endAt: null };
    const laterSpecial = { ...earlySpecial, id: 22, startAt: new Date("2026-09-01T01:00:00.000Z") };

    const result = getFeaturedSpecialCalendarEventOccurrence([sundayWorship, laterSpecial, earlySpecial], new Date("2026-08-08T00:00:00.000Z"));

    expect(result?.seriesId).toBe(earlySpecial.id);
    expect(result?.occurrenceStart).toEqual(earlySpecial.startAt);
  });

  it("falls back to the closest one-off non-service event when no category is marked special", () => {
    const oneOffOtherEvent = { ...sundayWorship, id: 32, eventType: "other" as const, recurrence: "none" as const, startAt: new Date("2026-08-15T01:00:00.000Z"), endAt: null };

    const result = getFeaturedSpecialCalendarEventOccurrence([sundayWorship, oneOffOtherEvent], new Date("2026-08-08T00:00:00.000Z"));

    expect(result?.seriesId).toBe(oneOffOtherEvent.id);
  });
});

describe("events router", () => {
  it("uses the published-only source for public calendar and Home queries", async () => {
    listPublishedCalendarEvents.mockResolvedValue([sundayWorship]);
    const caller = appRouter.createCaller(makeContext());

    const month = await caller.events.listRange({ start: new Date("2026-08-01T00:00:00.000Z"), end: new Date("2026-09-01T00:00:00.000Z") });
    const upcoming = await caller.events.upcoming();

    expect(listPublishedCalendarEvents).toHaveBeenCalledTimes(2);
    expect(month).toHaveLength(5);
    expect(upcoming[0]?.seriesId).toBe(sundayWorship.id);
    expect(listCalendarEvents).not.toHaveBeenCalled();
  });

  it("returns only the closest published special event for the featured banner", async () => {
    const specialEvent = { ...sundayWorship, id: 44, titleKo: "가을 특별 예배", eventType: "special" as const, recurrence: "none" as const, startAt: new Date("2026-09-14T01:00:00.000Z"), endAt: null };
    listPublishedCalendarEvents.mockResolvedValue([sundayWorship, specialEvent]);

    const featured = await appRouter.createCaller(makeContext()).events.featuredSpecial();

    expect(featured).toEqual(expect.objectContaining({ seriesId: specialEvent.id, eventType: "special" }));
    expect(listPublishedCalendarEvents).toHaveBeenCalledTimes(1);
  });

  it("denies a non-administrator before an event can be created", async () => {
    await expect(appRouter.createCaller(makeContext("user")).events.create({
      titleKo: "수요 기도회",
      startAt: new Date("2026-08-12T03:00:00.000Z"),
    })).rejects.toThrow();
    expect(createCalendarEvent).not.toHaveBeenCalled();
  });

  it("records the administrator, normalizes empty translations, and stores the all-day marker", async () => {
    createCalendarEvent.mockResolvedValue({ id: 20 });

    await appRouter.createCaller(makeContext("admin", 9)).events.create({
      titleKo: "교회 야유회",
      titleEn: "",
      startAt: new Date("2026-08-20T07:00:00.000Z"),
      allDay: true,
      venueKo: "",
      recurrence: "none",
      status: "published",
    });

    expect(createCalendarEvent).toHaveBeenCalledWith(expect.objectContaining({
      titleKo: "교회 야유회",
      titleEn: null,
      venueKo: null,
      allDay: 1,
      recurrenceUntil: null,
      createdBy: 9,
      status: "published",
    }));
  });
});

describe("gallery router", () => {
  it("uses the published-only album source and forwards an optional category filter", async () => {
    listPublishedPhotoAlbums.mockResolvedValue([{ id: 7, titleKo: "봄 교제", photoCount: 3 }]);

    const allAlbums = await appRouter.createCaller(makeContext()).gallery.listAlbums();
    const fellowshipAlbums = await appRouter.createCaller(makeContext()).gallery.listAlbums({ category: "fellowship" });

    expect(allAlbums).toHaveLength(1);
    expect(fellowshipAlbums).toHaveLength(1);
    expect(listPublishedPhotoAlbums).toHaveBeenNthCalledWith(1, undefined);
    expect(listPublishedPhotoAlbums).toHaveBeenNthCalledWith(2, "fellowship");
  });

  it("denies non-admin users before an album can be created", async () => {
    await expect(appRouter.createCaller(makeContext("user")).gallery.createAlbum({
      titleKo: "청년 교제", albumDate: "2026-08-30", category: "community", status: "draft",
    })).rejects.toThrow();
    expect(createPhotoAlbum).not.toHaveBeenCalled();
  });

  it("records the admin and normalizes blank optional album fields", async () => {
    createPhotoAlbum.mockResolvedValue({ id: 8 });

    await appRouter.createCaller(makeContext("admin", 9)).gallery.createAlbum({
      titleKo: "여름 연합 예배", titleEn: "", descriptionKo: "", albumDate: null, category: "worship", status: "draft", coverPhotoId: null,
    });

    expect(createPhotoAlbum).toHaveBeenCalledWith(expect.objectContaining({
      titleKo: "여름 연합 예배", titleEn: null, descriptionKo: null, albumDate: null, createdBy: 9, status: "draft",
    }));
  });
});
