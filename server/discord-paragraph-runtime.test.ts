import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const test = vi.hoisted(() => ({ spoken: [] as string[], failAt: -1, hold: null as null | Promise<void>, releases: null as null | (() => void) }));
vi.mock("discord.js", async () => {
  const { EventEmitter } = await import("node:events");
  class Client extends EventEmitter {
    user = { id: "bot", tag: "Test bot" };
    guilds = { fetch: async () => ({ id: "guild", voiceAdapterCreator: {}, channels: { fetch: async (id: string) => ({ id, isTextBased: () => true, isVoiceBased: () => true, permissionsFor: () => ({ has: () => true }) }) }, members: { fetch: async () => ({ id: "bot" }) } }) };
    login = async () => "test-token";
    isReady = () => true;
    destroy = async () => undefined;
  }
  return { Client, Events: { ClientReady: "clientReady" }, GatewayIntentBits: { Guilds: 1, GuildMessages: 2, MessageContent: 4, GuildVoiceStates: 8 }, PermissionFlagsBits: { ViewChannel: 1n, Connect: 2n, Speak: 4n } };
});
vi.mock("@discordjs/voice", async () => {
  const { EventEmitter } = await import("node:events");
  return { AudioPlayerStatus: { Idle: "idle", Playing: "playing" }, VoiceConnectionStatus: { Ready: "ready", Disconnected: "disconnected" }, createAudioPlayer: () => Object.assign(new EventEmitter(), { state: { status: "idle" }, play: vi.fn(), stop: vi.fn() }), joinVoiceChannel: () => Object.assign(new EventEmitter(), { state: { status: "ready" }, ping: {}, subscribe: vi.fn(), destroy: vi.fn(), rejoin: () => true }), entersState: async (target: unknown) => target };
});
vi.mock("./discordTts", () => ({
  getDiscordTtsStatus: () => ({ settings: { speaker: "Dennis", speed: 1.1, temperature: 1.1 } }),
  synthesizeDiscordText: async (text: string) => {
    test.spoken.push(text); if (test.hold) await test.hold;
    if (test.spoken.length === test.failAt) throw new Error("Simulated synthesis failure");
    return { engine: "deepinfra-inworld", latencyMs: 12, audio: Buffer.alloc(3840), format: "pcm" };
  }, convertAudioForDiscord: async (audio: Buffer) => audio,
}));
vi.mock("./discordAudio", () => ({ encodeDiscordOpus: async () => ({}), createBufferedOpusResource: () => ({ resource: {}, diagnostics: { wallPlaybackMs: 0, connectionInterruptions: 0 } }) }));
let bot: typeof import("./discordBot");
beforeEach(async () => { vi.resetModules(); test.spoken.length = 0; test.failAt = -1; test.hold = null; test.releases = null; vi.stubEnv("DISCORD_BOT_TOKEN", "test-token"); vi.stubEnv("DISCORD_TTS_BOT_ENABLED", "true"); bot = await import("./discordBot"); });
afterEach(async () => { test.releases?.(); await bot.stopDiscordTtsBot(); vi.unstubAllEnvs(); });
const input = { id: "a", transcriptId: 1, paragraphIndex: 0, text: "Welcome to worship. We are glad you are here." };
describe("manual paragraph runtime", () => {
  it("rejects disconnected admission without synthesis", () => { expect(() => bot.queueDiscordTranscriptParagraph(input, vi.fn())).toThrow(/Connected/); expect(test.spoken).toHaveLength(0); });
  it("speaks only the selected paragraph, completes all its sentences and never queues another", async () => {
    await bot.startDiscordTtsBot(); const updates: import("./discordBot").ParagraphBatch[] = [];
    bot.queueDiscordTranscriptParagraph(input, b => updates.push(b));
    await vi.waitFor(() => expect(bot.getDiscordParagraphBatch("a")?.status).toBe("completed"));
    expect(test.spoken).toEqual(["Welcome to worship.", "We are glad you are here."]);
    expect(updates.at(-1)?.completedCount).toBe(2); expect(updates[0].status).toBe("queued");
    expect(bot.getDiscordBotStatus().queueDepth).toBe(0);
  });
  it("deduplicates request IDs and rejects new paragraphs while busy", async () => {
    await bot.startDiscordTtsBot(); test.hold = new Promise(resolve => { test.releases = resolve; });
    bot.queueDiscordTranscriptParagraph(input, vi.fn());
    bot.queueDiscordTranscriptParagraph(input, vi.fn());
    expect(test.spoken).toHaveLength(1);
    expect(() => bot.queueDiscordTranscriptParagraph({ ...input, id: "b" }, vi.fn())).toThrow(/현재 송출/);
    test.releases!(); await vi.waitFor(() => expect(bot.getDiscordParagraphBatch("a")?.status).toBe("completed"));
  });
  it("halts the rest of a failed paragraph and forbids single-sentence retry", async () => {
    await bot.startDiscordTtsBot(); test.failAt = 1;
    bot.queueDiscordTranscriptParagraph(input, vi.fn());
    await vi.waitFor(() => expect(bot.getDiscordParagraphBatch("a")?.status).toBe("failed"));
    expect(test.spoken).toEqual(["Welcome to worship."]); expect(bot.getDiscordBotStatus().queueDepth).toBe(0);
    expect(bot.getDiscordParagraphBatch("a")?.completedCount).toBe(0);
    await expect(bot.retryLastDiscordTtsMessage()).rejects.toThrow(/전체 문단/);
  });
  it("Stop cancels an active batch without finishing or auto-resuming it", async () => {
    await bot.startDiscordTtsBot(); test.hold = new Promise(resolve => { test.releases = resolve; });
    const cb = vi.fn(); bot.queueDiscordTranscriptParagraph(input, cb);
    await bot.stopDiscordTtsBot(); expect(bot.getDiscordParagraphBatch("a")?.status).toBe("cancelled");
    test.releases!(); await new Promise(r => setTimeout(r, 10));
    await bot.startDiscordTtsBot(); expect(test.spoken).toHaveLength(1); expect(bot.getDiscordBotStatus().queueDepth).toBe(0);
    expect(cb.mock.calls.at(-1)?.[0].status).toBe("cancelled");
  });
  it("a failing progress callback cannot abort speech", async () => {
    await bot.startDiscordTtsBot(); bot.queueDiscordTranscriptParagraph(input, () => { throw new Error("Bad consumer"); });
    await vi.waitFor(() => expect(bot.getDiscordParagraphBatch("a")?.status).toBe("completed")); expect(test.spoken).toHaveLength(2);
  });
});
