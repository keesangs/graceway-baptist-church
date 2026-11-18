// Only allowlisted status labels leave the server. Never return the underlying
// networking state: it contains Discord voice tokens and encryption material.
const NETWORK_PHASES = [
  "voice-websocket-opening", "voice-websocket-identifying", "udp-ip-discovery",
  "protocol-selection", "ready", "voice-websocket-resuming", "closed",
] as const;
const VOICE_STATES = new Set(["signalling", "connecting", "ready", "disconnected", "destroyed"]);

export function summarizeVoiceConnection(state: unknown) {
  if (!state || typeof state !== "object") return { voiceState: "absent", networkPhase: "not-created" };
  const status = Reflect.get(state, "status");
  const networking = Reflect.get(state, "networking");
  const networkState = networking && typeof networking === "object" ? Reflect.get(networking, "state") : undefined;
  const code = networkState && typeof networkState === "object" ? Reflect.get(networkState, "code") : undefined;
  return {
    voiceState: typeof status === "string" && VOICE_STATES.has(status) ? status : "unknown",
    networkPhase: Number.isInteger(code) && code >= 0 && code < NETWORK_PHASES.length
      ? NETWORK_PHASES[code as number]
      : "not-created",
  };
}

export function voiceTimeoutMessage(state: unknown) {
  const summary = summarizeVoiceConnection(state);
  if (summary.networkPhase === "udp-ip-discovery") return "Discord UDP IP discovery did not complete within 30 seconds";
  if (summary.networkPhase === "voice-websocket-opening" || summary.networkPhase === "voice-websocket-identifying") return `Discord voice WebSocket handshake timed out (${summary.networkPhase})`;
  if (summary.voiceState === "signalling") return "Discord voice gateway signalling did not complete within 30 seconds";
  return `Discord voice readiness timed out (${summary.voiceState}/${summary.networkPhase})`;
}
