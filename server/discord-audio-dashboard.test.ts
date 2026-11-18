// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connected: true,
  state: null as string | null,
  preview: vi.fn(),
  voice: vi.fn(),
  refetch: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin" }, isAuthenticated: true, loading: false }) }));
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/BrandPageHero", () => ({ BrandPageHero: () => null }));
vi.mock("@/lib/trpc", () => {
  const generic = { useMutation: () => ({ mutate: vi.fn(), isPending: false }) };
  return { trpc: { discordTts: {
    status: { useQuery: () => ({ data: { remoteEnabled: true, apiKeyConfigured: true, state: "ready", lastEngine: "deepinfra-inworld", settings: { speaker: "Dennis", speed: 1.1, temperature: 1.1 } }, refetch: mocks.refetch }) },
    voices: { useQuery: () => ({ data: { voices: [{ id: "Dennis", name: "Dennis", kind: "preset" }], presetCount: 127, customCount: 0, source: "live", warning: null }, refetch: mocks.refetch, isFetching: false }) },
    botStatus: { useQuery: () => ({ data: { state: mocks.state ?? (mocks.connected ? "connected" : "stopped"), instanceId: "instance-1", voicePing: { ws: 35, udp: null },
      lastError: mocks.state === "starting" ? "Voice timeout" : null, lastErrorCode: "connection_unavailable",
      connectionDiagnostics: { stage: "voice connection", voiceState: "connecting", networkPhase: "udp-ip-discovery", startupRetryAttempts: 2, transitions: [] },
      history: [], allowedUserId: "1234", playback: { codec: "opusscript-worker", packetCount: 20, audioDurationMs: 200, wallPlaybackMs: 400,
        encodingMs: 7, underflowReads: 0, maxReadGapMs: 20, connectionInterruptions: 0,
        boundarySmoothing: { fadeInMs: 6, fadeOutMs: 12, encoderTailMs: 60 } } }, refetch: mocks.refetch }) },
    configure: generic, startBot: generic, pauseBot: generic, stopBot: generic, retryLastMessage: generic,
    test: { useMutation: (options: { onSuccess: (data: unknown) => Promise<void> }) => ({ isPending: false, mutate: () => {
      mocks.preview(); void options.onSuccess({ engine: "deepinfra-inworld", bytes: 100, latencyMs: 200, originalWavBase64: "UklGRg==", convertedWavBase64: "UklGRg==", smoothedWavBase64: "UklGRg==" });
    } }) },
    testDiscord: { useMutation: () => ({ isPending: false, mutate: mocks.voice }) },
  } } };
});
import DiscordTtsAdmin from "../client/src/pages/DiscordTtsAdmin";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); mocks.preview.mockClear(); mocks.voice.mockClear(); mocks.connected = true; mocks.state = null; });

describe("audio diagnosis dashboard", () => {
  it("renders separate original and converted audio controls without sending the preview to Discord", async () => {
    render(createElement(DiscordTtsAdmin));
    await userEvent.click(screen.getByRole("button", { name: "Test short sentence" }));
    await waitFor(() => expect(screen.getByLabelText("Original TTS audio preview")).toBeTruthy());
    expect(screen.getByLabelText("Converted audio preview").getAttribute("src")).toMatch(/^data:audio\/wav;base64,/);
    expect(screen.getByLabelText("Boundary-smoothed audio preview").getAttribute("src")).toMatch(/^data:audio\/wav;base64,/);
    expect(mocks.preview).toHaveBeenCalledTimes(1);
    expect(mocks.voice).not.toHaveBeenCalled();
  });

  it("sends the Discord test only through its explicit button and shows server-side diagnostics", async () => {
    render(createElement(DiscordTtsAdmin));
    await userEvent.click(screen.getByRole("button", { name: "Discord 송출 테스트" }));
    expect(mocks.voice).toHaveBeenCalledWith({ text: "Welcome to Graceway Baptist Church." });
    expect(screen.getByLabelText("Discord playback diagnostics").textContent).toContain("Runtime instance-1");
    expect(screen.getByLabelText("Discord playback diagnostics").textContent).toContain("20 ms (목표 20 ms)");
    expect(screen.getByLabelText("Sentence boundary smoothing").textContent).toContain("인코더 마무리 무음 60 ms");
  });

  it("disables Discord playback when the bot is not connected", () => {
    mocks.connected = false;
    render(createElement(DiscordTtsAdmin));
    expect((screen.getByRole("button", { name: "Discord 송출 테스트" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the stalled phase and blocks duplicate start/retry while preserving Stop", () => {
    mocks.state = "starting";
    render(createElement(DiscordTtsAdmin));
    expect(screen.getByLabelText("Voice connection phase").textContent).toContain("udp-ip-discovery");
    expect((screen.getByRole("button", { name: "연결 중…" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "자동 재연결 중" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Stop bot" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
