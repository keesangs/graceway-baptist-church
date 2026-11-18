import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_VOICE_CONTROLS, EXPRESSION_LIMITS, INWORLD_PRESET_VOICES, SPEAKING_RATE_LIMITS } from "@shared/discordVoiceControls";
import { Check, Loader2, RefreshCw } from "lucide-react";

type Controls = { speaker: string; speed: number; temperature: number };
type Patch = Partial<Controls>;
export default function DiscordVoiceControls({ settings, onSaved }: { settings?: Controls; onSaved: () => void }) {
  const [controls, setControls] = useState<Controls>(DEFAULT_VOICE_CONTROLS);
  const [filter, setFilter] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "waiting" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const dirty = useRef(false);
  const pendingPatch = useRef<Patch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catalog = trpc.discordTts.voices.useQuery({ refresh: true }, { staleTime: 600_000, refetchOnWindowFocus: false });
  const save = trpc.discordTts.configure.useMutation();

  useEffect(() => {
    if (settings && !dirty.current) setControls({ speaker: settings.speaker, speed: settings.speed, temperature: settings.temperature });
  }, [settings?.speaker, settings?.speed, settings?.temperature]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function flush() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pendingPatch.current;
    pendingPatch.current = {};
    if (!Object.keys(patch).length) return;
    const epoch = version.current;
    setSaveState("saving");
    save.mutate(patch, {
      onSuccess: next => {
        onSaved();
        if (epoch !== version.current) return;
        dirty.current = false;
        setControls({ speaker: next.settings.speaker, speed: next.settings.speed, temperature: next.settings.temperature });
        setSaveState("saved");
        setError(null);
      },
      onError: failure => {
        if (epoch !== version.current) return;
        setSaveState("error");
        setError(failure.message);
      },
    });
  }
  function change(patch: Patch, immediate = false) {
    version.current += 1;
    dirty.current = true;
    setControls(current => ({ ...current, ...patch }));
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    setError(null);
    if (immediate) flush();
    else {
      setSaveState("waiting");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 400);
    }
  }
  function adjust(key: "speed" | "temperature", value: number) {
    const limits = key === "speed" ? SPEAKING_RATE_LIMITS : EXPRESSION_LIMITS;
    change({ [key]: Math.round(Math.min(limits.max, Math.max(limits.min, value)) * 100) / 100 });
  }

  const voices = catalog.data?.voices ?? INWORLD_PRESET_VOICES.map(id => ({ id, name: id, kind: "preset" as const }));
  const visible = voices.filter(v => v.name.toLowerCase().includes(filter.toLowerCase()) || v.id === controls.speaker);
  const selected = voices.find(v => v.id === controls.speaker);
  const disabled = !settings;
  return <section className="space-y-5 rounded-xl border border-[#DCE4E7] bg-[#F4F6F7] p-4 sm:p-6" aria-label="Voice selection and fine controls">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div><h3 className="text-lg font-semibold text-[#17324D]">음성 선택 · 세부 조절 / Voice controls</h3><p className="mt-1 text-sm text-[#607A91]">음성 선택은 즉시 적용됩니다. 슬라이더는 조절을 멈추면 자동 저장되며 다음 문장부터 반영됩니다.</p></div>
      <p className="flex shrink-0 items-center gap-1 text-sm text-[#17324D]" role="status" aria-live="polite">
        {saveState === "saving" ? <Loader2 size={14} className="animate-spin" /> : saveState === "saved" ? <Check size={14} className="text-emerald-600" /> : null}
        {saveState === "saving" ? "적용·저장 중…" : saveState === "waiting" ? "변경 적용 대기…" : saveState === "saved" ? "적용·저장 완료" : saveState === "error" ? "저장 실패" : "저장된 설정 사용 중"}
      </p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label htmlFor="voice-filter" className="text-sm font-semibold text-[#17324D]">음성 이름 검색 / Search<Input id="voice-filter" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Dennis, Ashley…" className="mt-2 bg-white" /></label>
      <div><label htmlFor="deepinfra-speaker" className="text-sm font-semibold text-[#17324D]">전체 음성 목록 / Voice</label>
        <select id="deepinfra-speaker" aria-label="전체 음성 목록 / Voice" value={controls.speaker} onChange={e => change({ speaker: e.target.value }, true)} disabled={disabled} className="mt-2 h-10 w-full rounded-md border border-[#DCE4E7] bg-white px-3 text-sm text-[#17324D] outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F9F] disabled:opacity-50">
          {!selected && <option value={controls.speaker}>{controls.speaker} (현재 설정)</option>}
          <optgroup label="기본 음성 / Preset voices">{visible.filter(v => v.kind === "preset").map(v => <option key={v.id} value={v.id}>{v.name}{v.id === "Dennis" ? " · 기본 / Default" : ""}</option>)}</optgroup>
          {visible.some(v => v.kind === "custom") && <optgroup label="계정 사용자 음성 / Custom voices">{visible.filter(v => v.kind === "custom").map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>}
        </select>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#607A91]"><span>{catalog.data?.presetCount ?? INWORLD_PRESET_VOICES.length}개 기본 음성 · {catalog.data?.customCount ?? 0}개 사용자 음성{catalog.isFetching ? " · 목록 확인 중…" : catalog.data?.source === "snapshot" ? " · 저장본" : " · 공식 목록"}</span><Button variant="ghost" size="sm" onClick={() => void catalog.refetch()} disabled={catalog.isFetching}><RefreshCw size={13} /> 목록 새로고침</Button></div>
    {(catalog.data?.warning || catalog.error) && <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900" role="status">{catalog.data?.warning ?? "목록 조회 실패: 확인된 기본 음성 목록을 사용합니다."}</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      {(["speed", "temperature"] as const).map(key => {
        const isSpeed = key === "speed";
        const limits = isSpeed ? SPEAKING_RATE_LIMITS : EXPRESSION_LIMITS;
        const label = isSpeed ? "말하기 속도 / Speaking rate" : "표현·억양 변화 / Expressiveness";
        return <div key={key} className="rounded-lg bg-white p-4">
          <div className="flex items-center justify-between gap-2"><label htmlFor={`voice-${key}`} className="text-sm font-semibold text-[#17324D]">{label}</label><output htmlFor={`voice-${key}`} className="rounded-md bg-[#F4F6F7] px-2 py-1 font-mono text-sm font-bold text-[#17324D]">{controls[key].toFixed(2)}{isSpeed ? "×" : ""}</output></div>
          <input id={`voice-${key}`} aria-label={label} aria-valuetext={`${controls[key].toFixed(2)}${isSpeed ? " times" : " temperature"}`} type="range" min={limits.min} max={limits.max} step={0.01} value={controls[key]} onChange={e => adjust(key, Number(e.target.value))} disabled={disabled} className="mt-4 h-7 w-full cursor-pointer accent-[#C9973E] focus-visible:outline-2 focus-visible:outline-[#2F6F9F]" />
          <div className="flex items-center justify-between gap-2 text-xs text-[#607A91]"><span>{isSpeed ? "0.50× · 느리게" : "0.00 · 변화 적게"}</span><div className="flex gap-1"><Button variant="outline" size="sm" aria-label={`${label} decrease 0.01`} onClick={() => adjust(key, controls[key] - 0.01)} disabled={disabled || controls[key] <= limits.min}>−</Button><Button variant="outline" size="sm" aria-label={`${label} increase 0.01`} onClick={() => adjust(key, controls[key] + 0.01)} disabled={disabled || controls[key] >= limits.max}>+</Button></div><span>{isSpeed ? "1.50× · 빠르게" : "2.00 · 변화 크게"}</span></div>
          <p className="mt-3 text-xs leading-relaxed text-[#607A91]">{isSpeed ? "기본 1.10×. 실제 Inworld speaking_rate에 반영되며 음높이를 임의로 변경하지 않습니다." : "Temperature로 표현의 변화량을 조절합니다. 감정·음높이의 정확한 지정은 아니며, 높은 값은 음성이 덜 안정적일 수 있습니다."}</p>
        </div>;
      })}
    </div>
    <div className="flex flex-wrap items-center gap-3"><Button variant="outline" disabled={disabled} onClick={() => change(DEFAULT_VOICE_CONTROLS, true)}>기본값 복원 · Dennis / 1.10×</Button><span className="text-xs text-[#607A91]">목록·슬라이더는 재연결 없이 반영됩니다. 설정은 서버 DB에 저장되어 재시작 후 유지됩니다.</span></div>
    {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert"><p>설정을 저장하지 못했습니다: {error}</p><Button variant="outline" className="mt-2" onClick={() => change(controls, true)}>다시 적용 / Retry</Button></div>}
  </section>;
}
