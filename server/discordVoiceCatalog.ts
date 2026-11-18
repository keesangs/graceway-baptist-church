import { createHash } from "node:crypto";
import { INWORLD_MODEL_METADATA_URL, INWORLD_PRESET_VOICES } from "../shared/discordVoiceControls";

export type VoiceChoice = { id: string; name: string; kind: "preset" | "custom" };
let cached: { key: string; expiresAt: number; value: VoiceCatalog } | undefined;
let pending: { key: string; result: Promise<VoiceCatalog> } | undefined;
export type VoiceCatalog = { voices: VoiceChoice[]; presetCount: number; customCount: number; source: "live" | "snapshot"; warning: string | null };

export async function loadInworldVoiceCatalog(apiKey: string, refresh = false): Promise<VoiceCatalog> {
  const key = createHash("sha256").update(apiKey).digest("hex");
  if (!refresh && cached?.key === key && cached.expiresAt > Date.now()) return cached.value;
  if (pending?.key === key) return pending.result;
  const result = (async () => {
    const warnings: string[] = [];
    let presetNames: string[] = [...INWORLD_PRESET_VOICES];
    let source: VoiceCatalog["source"] = "snapshot";
    let custom: VoiceChoice[] = [];
    await Promise.all([
      (async () => {
        try {
          const response = await fetch(INWORLD_MODEL_METADATA_URL, { signal: AbortSignal.timeout(5_000) });
          if (!response.ok) throw new Error("Model metadata unavailable");
          const data = await response.json();
          const names = data?.in_schema?.definitions?.InworldTtsVoice?.enum;
          if (!Array.isArray(names) || !names.length || names.length > 1_000 || !names.every(n => typeof n === "string" && n.length > 0 && n.length <= 80)) throw new Error("Invalid voice metadata");
          presetNames = Array.from(new Set<string>(names)).sort((a, b) => a.localeCompare(b));
          source = "live";
        } catch {
          warnings.push("공식 목록 조회 실패: 2026-11-18에 확인한 127개 기본 음성 저장본을 사용합니다.");
        }
      })(),
      (async () => {
        if (!apiKey) return;
        try {
          const response = await fetch("https://api.deepinfra.com/v1/voices", {
            headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(5_000),
          });
          if (!response.ok) throw new Error("Custom voice list unavailable");
          const data = await response.json();
          if (!Array.isArray(data?.voices)) throw new Error("Invalid custom voice list");
          custom = data.voices.filter((v: any) => typeof v.voice_id === "string" && v.voice_id.length > 0 && v.voice_id.length <= 80 && typeof v.name === "string")
            .map((v: any) => ({ id: v.voice_id, name: v.name.slice(0, 120), kind: "custom" as const }));
        } catch {
          warnings.push("계정 사용자 음성은 조회하지 못했습니다. 기본 음성은 계속 선택할 수 있습니다.");
        }
      })(),
    ]);
    const presets = presetNames.map(id => ({ id, name: id, kind: "preset" as const }));
    const all = [...presets, ...custom];
    const voices = all.filter((voice, index) => all.findIndex(v => v.id === voice.id) === index);
    const value: VoiceCatalog = { voices, presetCount: presets.length, customCount: voices.filter(v => v.kind === "custom").length, source, warning: warnings.length ? warnings.join(" ") : null };
    // Shorter TTL for failures; cached by credential hash, never across accounts.
    cached = { key, value, expiresAt: Date.now() + (warnings.length ? 30_000 : 600_000) };
    return value;
  })();
  pending = { key, result };
  try { return await result; } finally { if (pending?.result === result) pending = undefined; }
}

export function resetVoiceCatalogForTests() { cached = undefined; pending = undefined; }
