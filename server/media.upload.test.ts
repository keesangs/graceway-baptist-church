import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock storagePut and DB helpers
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "church-media/image/test_abc12345.png", url: "/manus-storage/church-media/image/test_abc12345.png" }),
}));

vi.mock("./db", () => ({
  insertMediaFile: vi.fn().mockResolvedValue(undefined),
  listMediaFiles: vi.fn().mockResolvedValue([
    {
      id: 1,
      filename: "test.png",
      fileKey: "church-media/image/test_abc12345.png",
      url: "/manus-storage/church-media/image/test_abc12345.png",
      mimeType: "image/png",
      fileSize: 1024,
      category: "image",
      description: "Test image",
      uploadedBy: 1,
      createdAt: new Date("2026-08-01"),
    },
  ]),
  deleteMediaFile: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAnonContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("media.list", () => {
  it("returns files for authenticated users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.media.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].filename).toBe("test.png");
  });

  it("returns files for anonymous users (public)", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    const result = await caller.media.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("media.upload", () => {
  it("uploads a file and returns key+url", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.media.upload({
      filename: "test.png",
      mimeType: "image/png",
      fileSize: 1024,
      category: "image",
      description: "Test image",
      data: Buffer.from("fake image data").toString("base64"),
    });
    expect(result.url).toMatch(/^\/manus-storage\//);
    expect(result.key).toContain("church-media/image");
  });

  it("rejects unauthenticated upload", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(
      caller.media.upload({
        filename: "test.png",
        mimeType: "image/png",
        fileSize: 1024,
        category: "image",
        data: "dGVzdA==",
      }),
    ).rejects.toThrow();
  });

  it("rejects files over 50 MB", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.media.upload({
        filename: "huge.mp4",
        mimeType: "video/mp4",
        fileSize: 60 * 1024 * 1024, // 60 MB
        category: "sermon",
        data: "dGVzdA==",
      }),
    ).rejects.toThrow("50 MB");
  });
});

describe("media.delete", () => {
  it("allows admin to delete", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.media.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin delete", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.media.delete({ id: 1 })).rejects.toThrow();
  });
});
