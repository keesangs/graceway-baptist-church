/**
 * Tests for the visitor-facing engagement procedures: newsletter signup and the
 * Connect-page contact form. The database layer is mocked so these run without
 * a live MySQL connection; the goal is to lock in the validation rules,
 * normalization behaviour, and the public/admin access boundary.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const subscribeToNewsletter = vi.fn();
const listNewsletterSubscribers = vi.fn();
const insertContactMessage = vi.fn();
const listContactMessages = vi.fn();

const notifyOwner = vi.fn();

vi.mock("./_core/notification", () => ({
  notifyOwner: (...args: unknown[]) => notifyOwner(...args),
}));

vi.mock("./db", () => ({
  // Engagement helpers under test
  subscribeToNewsletter: (...args: unknown[]) => subscribeToNewsletter(...args),
  listNewsletterSubscribers: (...args: unknown[]) => listNewsletterSubscribers(...args),
  insertContactMessage: (...args: unknown[]) => insertContactMessage(...args),
  listContactMessages: (...args: unknown[]) => listContactMessages(...args),
  // Unrelated helpers the router imports at module load
  insertMediaFile: vi.fn(),
  listMediaFiles: vi.fn(),
  deleteMediaFile: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  getDb: vi.fn(),
}));

const { appRouter } = await import("./routers");

function makeContext(role?: "user" | "admin"): TrpcContext {
  const user = role
    ? {
        id: 1,
        openId: "test-open-id",
        email: "member@example.com",
        name: "Test Member",
        loginMethod: "manus",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: { protocol: "https", headers: {} },
    res: { clearCookie: vi.fn(), cookie: vi.fn() },
  } as unknown as TrpcContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  notifyOwner.mockResolvedValue(true);
});

describe("newsletter.subscribe", () => {
  it("accepts an anonymous visitor and normalizes the email to lowercase", async () => {
    subscribeToNewsletter.mockResolvedValue({ email: "visitor@example.com", lang: "en" });
    const caller = appRouter.createCaller(makeContext());

    const result = await caller.newsletter.subscribe({
      email: "  Visitor@Example.COM  ",
      lang: "en",
    });

    expect(result).toEqual({ success: true, email: "visitor@example.com" });
    expect(subscribeToNewsletter).toHaveBeenCalledWith({
      email: "visitor@example.com",
      lang: "en",
    });
  });

  it("stores the Korean language preference when the site is in KO mode", async () => {
    subscribeToNewsletter.mockResolvedValue({ email: "korean@example.com", lang: "ko" });
    const caller = appRouter.createCaller(makeContext());

    await caller.newsletter.subscribe({ email: "korean@example.com", lang: "ko" });

    expect(subscribeToNewsletter).toHaveBeenCalledWith({
      email: "korean@example.com",
      lang: "ko",
    });
  });

  it("rejects a malformed email address before touching the database", async () => {
    const caller = appRouter.createCaller(makeContext());

    await expect(caller.newsletter.subscribe({ email: "not-an-email", lang: "en" })).rejects.toThrow();
    expect(subscribeToNewsletter).not.toHaveBeenCalled();
  });

  it("keeps the subscriber list admin-only", async () => {
    const caller = appRouter.createCaller(makeContext("user"));

    await expect(caller.newsletter.list()).rejects.toThrow();
    expect(listNewsletterSubscribers).not.toHaveBeenCalled();
  });
});

describe("contact.submit", () => {
  it("persists a visitor enquiry with trimmed fields", async () => {
    insertContactMessage.mockResolvedValue({ insertId: 7 });
    const caller = appRouter.createCaller(makeContext());

    const result = await caller.contact.submit({
      firstName: "  Grace  ",
      lastName: "  Kim  ",
      email: "  Grace.Kim@Example.com ",
      phone: " 510-529-5636 ",
      topic: "visit",
      message: "  We would like to visit this Sunday.  ",
    });

    expect(result).toEqual({ success: true });
    expect(insertContactMessage).toHaveBeenCalledWith({
      firstName: "Grace",
      lastName: "Kim",
      email: "grace.kim@example.com",
      phone: "510-529-5636",
      topic: "visit",
      message: "We would like to visit this Sunday.",
    });
  });

  it("converts blank optional fields to null rather than empty strings", async () => {
    insertContactMessage.mockResolvedValue({ insertId: 8 });
    const caller = appRouter.createCaller(makeContext());

    await caller.contact.submit({
      firstName: "John",
      lastName: "Park",
      email: "john@example.com",
      phone: "   ",
      topic: "prayer",
      message: "   ",
    });

    expect(insertContactMessage).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null, message: null }),
    );
  });

  it("rejects an unknown topic value", async () => {
    const caller = appRouter.createCaller(makeContext());

    await expect(
      caller.contact.submit({
        firstName: "John",
        lastName: "Park",
        email: "john@example.com",
        // @ts-expect-error deliberately invalid enum value
        topic: "donations",
      }),
    ).rejects.toThrow();
    expect(insertContactMessage).not.toHaveBeenCalled();
  });

  it("alerts church staff with the enquiry details", async () => {
    insertContactMessage.mockResolvedValue({ insertId: 9 });
    const caller = appRouter.createCaller(makeContext());

    await caller.contact.submit({
      firstName: "Grace",
      lastName: "Kim",
      email: "grace.kim@example.com",
      topic: "visit",
      message: "We would like to visit this Sunday.",
    });

    expect(notifyOwner).toHaveBeenCalledTimes(1);
    const { title, content } = notifyOwner.mock.calls[0][0];
    expect(title).toContain("Grace Kim");
    expect(content).toContain("grace.kim@example.com");
    expect(content).toContain("We would like to visit this Sunday.");
  });

  it("still reports success to the visitor when the notification service throws", async () => {
    insertContactMessage.mockResolvedValue({ insertId: 10 });
    notifyOwner.mockRejectedValue(new Error("notification service down"));
    const caller = appRouter.createCaller(makeContext());

    const result = await caller.contact.submit({
      firstName: "John",
      lastName: "Park",
      email: "john@example.com",
      topic: "prayer",
    });

    // The enquiry was persisted, so a downstream alert outage must not surface as
    // a failed submission to the visitor.
    expect(result).toEqual({ success: true });
    expect(insertContactMessage).toHaveBeenCalledTimes(1);
  });

  it("still reports success when the notification service returns false (soft failure)", async () => {
    insertContactMessage.mockResolvedValue({ insertId: 11 });
    notifyOwner.mockResolvedValue(false);
    const caller = appRouter.createCaller(makeContext());

    const result = await caller.contact.submit({
      firstName: "Sarah",
      lastName: "Lee",
      email: "sarah.lee@example.com",
      topic: "ministry",
    });

    // A false return from notifyOwner means the service is temporarily
    // unavailable. The enquiry is already in the database, so the visitor
    // must still receive a success response.
    expect(result).toEqual({ success: true });
    expect(insertContactMessage).toHaveBeenCalledTimes(1);
    expect(notifyOwner).toHaveBeenCalledTimes(1);
  });

  it("keeps the message inbox admin-only", async () => {
    const caller = appRouter.createCaller(makeContext("user"));

    await expect(caller.contact.list()).rejects.toThrow();
    expect(listContactMessages).not.toHaveBeenCalled();
  });

  it("lets an admin read the message inbox", async () => {
    listContactMessages.mockResolvedValue([{ id: 1, firstName: "Grace" }]);
    const caller = appRouter.createCaller(makeContext("admin"));

    const rows = await caller.contact.list();

    expect(rows).toHaveLength(1);
    expect(listContactMessages).toHaveBeenCalledTimes(1);
  });
});
