import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { discordPcmToWav, smoothDiscordSentencePcm } from "./discordAudio";
import { resetDiscordTtsForTests } from "./discordTts";

function context(role: "admin" | "user" | null): TrpcContext {
  return {
    user: role ? { id: 1, openId: "audio-test", name: "Test", email: null, loginMethod: "test", role,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
    req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"],
  };
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); resetDiscordTtsForTests(); });

describe("administrator-only audio comparison", () => {
  for (const role of [null, "user"] as const) {
    it(`rejects preview and Discord playback for role ${role}`, async () => {
      const caller = appRouter.createCaller(context(role));
      await expect(caller.discordTts.test({ text: "Welcome." })).rejects.toThrow();
      await expect(caller.discordTts.testDiscord({ text: "Welcome." })).rejects.toThrow();
      await expect(caller.discordTts.botStatus()).rejects.toThrow();
    });
  }

  it("returns original and converted WAV previews only to an administrator, without secrets", async () => {
    vi.stubEnv("DEEPINFRA_API_KEY", "never-return-this-key");
    const pcm = Buffer.alloc(48_000 * 4 / 10);
    for (let offset = 0; offset < pcm.length; offset += 2) pcm.writeInt16LE(12_000, offset);
    const original = discordPcmToWav(pcm);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ audio: `data:audio/wav;base64,${original.toString("base64")}` }), { headers: { "content-type": "application/json" } })));
    const result = await appRouter.createCaller(context("admin")).discordTts.test({ text: "Welcome." });
    expect(Buffer.from(result.originalWavBase64, "base64")).toEqual(original);
    expect(Buffer.from(result.convertedWavBase64, "base64").toString("ascii", 0, 4)).toBe("RIFF");
    const converted = Buffer.from(result.convertedWavBase64, "base64").subarray(44);
    expect(converted).toEqual(pcm);
    const smoothed = Buffer.from(result.smoothedWavBase64, "base64");
    expect(smoothed).toEqual(discordPcmToWav(smoothDiscordSentencePcm(converted)));
    expect(smoothed.length).toBe(original.length);
    expect(smoothed.readInt16LE(44)).toBe(0);
    expect(smoothed.readInt16LE(smoothed.length - 2)).toBe(0);
    expect(result.durationMs).toBe(100);
    expect(JSON.stringify(result)).not.toContain("never-return-this-key");
  });

  it("does not claim playback when the bot is stopped", async () => {
    await expect(appRouter.createCaller(context("admin")).discordTts.testDiscord({ text: "Welcome." })).rejects.toThrow("연결된 후");
  });

  it("rejects an oversized preview input before synthesizing", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(appRouter.createCaller(context("admin")).discordTts.test({ text: "a".repeat(251) })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
