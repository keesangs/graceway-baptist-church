import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  clients: [] as Array<{ ready: boolean; destroyed: boolean; listenerCount: (event: string) => number }>,
  failVoice: false,
  joined: [] as number[],
}));

vi.mock("discord.js", async () => {
  const { EventEmitter } = await import("node:events");
  class TestClient extends EventEmitter {
    ready = false;
    destroyed = false;
    user = { id: "bot-1", tag: "Test bot" };
    index = state.clients.length;
    guilds = { fetch: vi.fn(async () => ({
      id: "guild-1",
      voiceAdapterCreator: this.index,
      channels: { fetch: async (id: string) => ({
        id, isTextBased: () => true, isVoiceBased: () => true,
        permissionsFor: () => ({ has: () => true }),
      }) },
      members: { fetch: async () => ({ id: "bot-1" }) },
    })) };
    constructor() { super(); state.clients.push(this); }
    async login() {
      if (this.destroyed) throw new Error("Destroyed client reused");
      // Deliberately resolve login before the shard-ready event.
      setTimeout(() => { if (!this.destroyed) { this.ready = true; this.emit("clientReady", this); } }, 5);
      return "test-token";
    }
    isReady() { return this.ready && !this.destroyed; }
    async destroy() { this.destroyed = true; this.ready = false; }
  }
  return {
    Client: TestClient, Events: { ClientReady: "clientReady" },
    GatewayIntentBits: { Guilds: 1, GuildMessages: 2, MessageContent: 4, GuildVoiceStates: 8 },
    PermissionFlagsBits: { ViewChannel: 1n, Connect: 2n, Speak: 4n },
  };
});

vi.mock("@discordjs/voice", async importOriginal => {
  const actual = await importOriginal<typeof import("@discordjs/voice")>();
  const { EventEmitter } = await import("node:events");
  return {
    ...actual,
    createAudioPlayer: () => Object.assign(new EventEmitter(), { state: { status: "idle" }, stop: vi.fn() }),
    joinVoiceChannel: ({ adapterCreator }: { adapterCreator: number }) => {
      const client = state.clients[adapterCreator];
      if (!client.ready || client.destroyed) throw new Error("Voice attempted before shard readiness");
      state.joined.push(adapterCreator);
      return Object.assign(new EventEmitter(), {
        state: { status: "ready" }, ping: {}, subscribe: vi.fn(),
        destroy: vi.fn(), rejoin: () => true,
      });
    },
    entersState: async (target: unknown) => {
      if (state.failVoice) throw new Error("simulated voice failure");
      return target;
    },
  };
});

type Runtime = typeof import("./discordBot");
let runtime: Runtime;
beforeEach(async () => {
  vi.resetModules(); state.clients.length = 0; state.joined.length = 0; state.failVoice = false;
  vi.stubEnv("DISCORD_BOT_TOKEN", "test-token"); vi.stubEnv("DISCORD_TTS_BOT_ENABLED", "true");
  runtime = await import("./discordBot");
});
afterEach(async () => { await runtime.stopDiscordTtsBot(); vi.unstubAllEnvs(); });

describe("Discord client lifecycle", () => {
  it("waits for shard readiness and replaces the destroyed client on Stop/Start", async () => {
    expect((await runtime.startDiscordTtsBot()).state).toBe("connected");
    const first = state.joined[0];
    expect(state.clients[first].ready).toBe(true);
    await runtime.stopDiscordTtsBot();
    expect(state.clients[first].destroyed).toBe(true);
    expect(state.clients[first].listenerCount("messageCreate")).toBe(0);
    expect((await runtime.startDiscordTtsBot()).state).toBe("connected");
    expect(state.joined[1]).not.toBe(first);
    expect(state.clients[state.joined[1]].destroyed).toBe(false);
  });

  it("awaits retirement after a failed voice attempt and retries with fresh adapters", async () => {
    state.failVoice = true;
    const failed = await runtime.startDiscordTtsBot();
    expect(failed.state).toBe("error");
    const retired = state.joined[0];
    expect(state.clients[retired].destroyed).toBe(true);
    state.failVoice = false;
    expect((await runtime.startDiscordTtsBot()).state).toBe("connected");
    expect(state.joined[1]).not.toBe(retired);
    expect(state.clients[retired].listenerCount("error")).toBe(0);
    expect(state.clients[state.joined[1]].listenerCount("messageCreate")).toBe(1);
  });
});
