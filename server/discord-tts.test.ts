import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { configureDiscordTts, getDiscordTtsStatus, resetDiscordTtsForTests, synthesizeDiscordText } from "./discordTts";

const pageSource = readFileSync(resolve(process.cwd(), "client/src/pages/DiscordTtsAdmin.tsx"), "utf8");
const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

describe("Discord DeepInfra TTS", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DEEPINFRA_API_KEY;
    resetDiscordTtsForTests();
  });

  it("uses the remote provider response and records the real engine", async () => {
    process.env.DEEPINFRA_API_KEY = "test-key";
    const audio = Buffer.from("RIFF-test-audio");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(audio, {
      status: 200,
      headers: { "content-type": "audio/wav" },
    })));

    configureDiscordTts({ remoteEnabled: true });
    const result = await synthesizeDiscordText("A short worship announcement.");

    expect(result.engine).toBe("deepinfra-qwen");
    expect(result.audio).toEqual(audio);
    expect(getDiscordTtsStatus()).toMatchObject({ lastEngine: "deepinfra-qwen", completedCount: 1, failedCount: 0 });
  });

  it("exposes configuration state without exposing credentials", () => {
    process.env.DEEPINFRA_API_KEY = "test-key";
    configureDiscordTts({ remoteEnabled: true });
    const status = getDiscordTtsStatus();
    expect(status.apiKeyConfigured).toBe(true);
    expect(JSON.stringify(status)).not.toContain("test-key");
  });

  it("keeps the dashboard route, polling, toggle, and admin procedure contract", () => {
    expect(appSource).toContain("/admin/discord-tts");
    expect(pageSource).toContain("refetchInterval: 2_000");
    expect(pageSource).toContain("Enable remote TTS");
    expect(pageSource).toContain("DeepInfra Qwen active");
    expect(pageSource).toContain("Local fallback active");
    expect(pageSource).toContain("Admin only");
    expect(pageSource).toContain("Admin's live worship text announcements");
    expect(pageSource).toContain("deepinfra-api-key");
    expect(readFileSync(resolve(process.cwd(), "server/discordTts.ts"), "utf8")).toContain('"-nostdin"');
    expect(readFileSync(resolve(process.cwd(), "server/discordTts.ts"), "utf8")).toContain("inputCandidates");
    expect(routerSource).toContain("discordTts: router({");
    expect(routerSource).toContain("status: adminProcedure");
    expect(routerSource).toContain("configure: adminProcedure");
  });
});
