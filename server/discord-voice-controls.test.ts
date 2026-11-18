import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_VOICE_CONTROLS, INWORLD_MODEL_METADATA_URL, INWORLD_PRESET_VOICES } from "../shared/discordVoiceControls";
import { loadInworldVoiceCatalog, resetVoiceCatalogForTests } from "./discordVoiceCatalog";
import { configureDiscordTts, configureDiscordTtsAndSave, getDiscordTtsStatus, resetDiscordTtsForTests, synthesizeDiscordText } from "./discordTts";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({ read: vi.fn().mockResolvedValue(null), save: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./discordTtsPreferences", () => ({ readVoicePreferences: db.read, saveVoicePreferences: db.save }));
const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
function ctx(role: "admin" | "user" | null): TrpcContext {
  return { user: role ? { id: 1, openId: "voice-controls-test", name: "Test", email: null, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
    req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}
beforeEach(() => { resetVoiceCatalogForTests(); resetDiscordTtsForTests(); db.read.mockResolvedValue(null); db.save.mockReset().mockResolvedValue(undefined); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Inworld catalog and actual controls", () => {
  it("contains all 127 exact preset names and merges account voices without account secrets", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url === INWORLD_MODEL_METADATA_URL
      ? json({ in_schema: { definitions: { InworldTtsVoice: { enum: INWORLD_PRESET_VOICES } } } })
      : json({ voices: [{ voice_id: "custom-1", name: "Church voice", user_id: "private-account", description: "private metadata" }] })));
    const catalog = await loadInworldVoiceCatalog("private-api-key");
    expect(INWORLD_PRESET_VOICES).toHaveLength(127);
    expect(new Set(INWORLD_PRESET_VOICES).size).toBe(127);
    expect(catalog).toMatchObject({ source: "live", presetCount: 127, customCount: 1 });
    expect(catalog.voices).toHaveLength(128);
    expect(catalog.voices).toContainEqual({ id: "custom-1", name: "Church voice", kind: "custom" });
    expect(JSON.stringify(catalog)).not.toMatch(/private-account|private-api-key|private metadata/);
  });

  it("falls back to every verified preset with a truthful warning when discovery fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const catalog = await loadInworldVoiceCatalog("private-key");
    expect(catalog.voices).toHaveLength(127);
    expect(catalog.source).toBe("snapshot");
    expect(catalog.warning).toContain("저장본");
    expect(catalog.customCount).toBe(0);
  });

  it("caches within one credential and fetches separately after key rotation", async () => {
    const fetcher = vi.fn(async (url: string) => url === INWORLD_MODEL_METADATA_URL
      ? json({ in_schema: { definitions: { InworldTtsVoice: { enum: ["Dennis"] } } } }) : json({ voices: [] }));
    vi.stubGlobal("fetch", fetcher);
    await loadInworldVoiceCatalog("key-one"); await loadInworldVoiceCatalog("key-one");
    expect(fetcher).toHaveBeenCalledTimes(2);
    await loadInworldVoiceCatalog("key-two");
    expect(fetcher).toHaveBeenCalledTimes(4);
    await loadInworldVoiceCatalog("key-two", true);
    expect(fetcher).toHaveBeenCalledTimes(6);
  });

  it("actually sends precise rate and temperature and excludes unsupported instructions", async () => {
    vi.stubEnv("DEEPINFRA_API_KEY", "test-key");
    const fetcher = vi.fn().mockResolvedValue(new Response(Buffer.from("RIFF-test"), { headers: { "content-type": "audio/wav" } }));
    vi.stubGlobal("fetch", fetcher);
    configureDiscordTts({ speed: 1.13, temperature: 0.82, instruct: "not a supported hosted parameter" });
    await synthesizeDiscordText("Welcome.");
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body).toMatchObject({ voice: "Dennis", speaking_rate: 1.13, temperature: 0.82, output_format: "wav" });
    expect(body.instruct).toBeUndefined();
    expect(body.instructions).toBeUndefined();
  });

  it("restores saved voice controls once after a fresh process import", async () => {
    db.read.mockResolvedValue({ speaker: "Ashley", speed: 1.19, temperature: 0.93 });
    vi.resetModules();
    const runtime = await import("./discordTts");
    await runtime.initializeDiscordTtsPreferences();
    await runtime.initializeDiscordTtsPreferences();
    expect(runtime.getDiscordTtsStatus().settings).toMatchObject({ speaker: "Ashley", speed: 1.19, temperature: 0.93 });
  });

  it("keeps the started sentence settings stable when controls change during inference", async () => {
    vi.stubEnv("DEEPINFRA_API_KEY", "test-key");
    let release!: (response: Response) => void;
    const fetcher = vi.fn(() => new Promise<Response>(resolve => { release = resolve; }));
    vi.stubGlobal("fetch", fetcher);
    const speaking = synthesizeDiscordText("Welcome.");
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    configureDiscordTts({ speaker: "Ashley", speed: 1.32, temperature: 0.88 });
    release(new Response(Buffer.from("RIFF-test"), { headers: { "content-type": "audio/wav" } }));
    await speaking;
    const call = fetcher.mock.calls[0] as unknown as [string, { body: string }];
    expect(JSON.parse(call[1].body)).toMatchObject({ voice: "Dennis", speaking_rate: 1.1, temperature: 1.1 });
    expect(getDiscordTtsStatus().settings.speaker).toBe("Ashley");
  });

  it("serializes partial saves so voice and speed updates both survive", async () => {
    await Promise.all([configureDiscordTtsAndSave({ speaker: "Ashley" }), configureDiscordTtsAndSave({ speed: 1.23 })]);
    expect(getDiscordTtsStatus().settings).toMatchObject({ speaker: "Ashley", speed: 1.23, temperature: 1.1 });
    expect(db.save.mock.calls[1][0]).toEqual({ speaker: "Ashley", speed: 1.23, temperature: 1.1 });
    expect(JSON.stringify(db.save.mock.calls)).not.toMatch(/apiKey|instruct|remoteEnabled/);
  });

  it("does not apply a setting when persistent save fails", async () => {
    db.save.mockRejectedValueOnce(new Error("database down"));
    await expect(configureDiscordTtsAndSave({ speed: 1.25 })).rejects.toThrow("database down");
    expect(getDiscordTtsStatus().settings.speed).toBe(DEFAULT_VOICE_CONTROLS.speed);
    await configureDiscordTtsAndSave({ speed: 1.21 });
    expect(getDiscordTtsStatus().settings.speed).toBe(1.21);
  });

  it("rejects out-of-range and nonfinite controls before saving", async () => {
    await expect(configureDiscordTtsAndSave({ speed: 1.51 })).rejects.toThrow();
    await expect(configureDiscordTtsAndSave({ temperature: -0.01 })).rejects.toThrow();
    expect(() => configureDiscordTts({ speed: NaN })).toThrow();
    expect(db.save).not.toHaveBeenCalled();
  });

  for (const role of [null, "user"] as const) {
    it(`protects voice catalog and immediate save from role ${role}`, async () => {
      const caller = appRouter.createCaller(ctx(role));
      await expect(caller.discordTts.voices()).rejects.toThrow();
      await expect(caller.discordTts.configure({ speed: 1.1 })).rejects.toThrow();
      expect(db.save).not.toHaveBeenCalled();
    });
  }

  it("supports administrator partial controls without changing remote-enabled state", async () => {
    configureDiscordTts({ remoteEnabled: false });
    const next = await appRouter.createCaller(ctx("admin")).discordTts.configure({ speed: 1.14, temperature: 0.94 });
    expect(next).toMatchObject({ remoteEnabled: false, settings: { speed: 1.14, temperature: 0.94, speaker: "Dennis" } });
  });
});
