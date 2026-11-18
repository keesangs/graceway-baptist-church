import { describe, expect, it } from "vitest";
import { summarizeVoiceConnection, voiceTimeoutMessage } from "./discordVoiceDiagnostics";

describe("safe voice connection phase diagnostics", () => {
  it("distinguishes voice WebSocket, UDP discovery, protocol selection and Ready", () => {
    expect(summarizeVoiceConnection({ status: "connecting", networking: { state: { code: 0 } } }).networkPhase).toBe("voice-websocket-opening");
    expect(summarizeVoiceConnection({ status: "connecting", networking: { state: { code: 2 } } }).networkPhase).toBe("udp-ip-discovery");
    expect(summarizeVoiceConnection({ status: "connecting", networking: { state: { code: 3 } } }).networkPhase).toBe("protocol-selection");
    expect(summarizeVoiceConnection({ status: "ready", networking: { state: { code: 4 } } }).networkPhase).toBe("ready");
  });
  it("does not copy tokens, secrets, networking objects or unknown status values", () => {
    const summary = summarizeVoiceConnection({ status: "connecting", token: "voice-secret", networking: { state: { code: 2, token: "voice-secret", secretKey: [1, 2, 3], udp: { ip: "private-ip" } } } });
    expect(summary).toEqual({ voiceState: "connecting", networkPhase: "udp-ip-discovery" });
    expect(JSON.stringify(summary)).not.toMatch(/voice-secret|private-ip|secretKey/);
    expect(summarizeVoiceConnection({ status: "voice-secret" }).voiceState).toBe("unknown");
  });
  it("handles absent and unexpected connection states safely", () => {
    expect(summarizeVoiceConnection(undefined)).toEqual({ voiceState: "absent", networkPhase: "not-created" });
    expect(summarizeVoiceConnection({ status: "connecting", networking: { state: { code: 999 } } }).networkPhase).toBe("not-created");
  });
  it("reports the stalled phase without claiming a timeout proves UDP restriction", () => {
    expect(voiceTimeoutMessage({ status: "connecting", networking: { state: { code: 2 } } })).toContain("UDP IP discovery");
    expect(voiceTimeoutMessage({ status: "signalling" })).toContain("gateway signalling");
    expect(voiceTimeoutMessage({ status: "connecting", networking: { state: { code: 1 } } })).toContain("WebSocket handshake");
  });
});
