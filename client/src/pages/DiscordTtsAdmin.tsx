import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrandPageHero } from "@/components/BrandPageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Loader2, LogIn, Radio, RefreshCw, ShieldAlert, Volume2, Wifi, WifiOff } from "lucide-react";

function StatusPill({ remoteEnabled, currentEngine, lastEngine, state }: { remoteEnabled: boolean; currentEngine: string | null; lastEngine: string | null; state: string }) {
  const activeEngine = currentEngine ?? lastEngine;
  const isDeepInfra = remoteEnabled && activeEngine === "deepinfra-inworld";
  const isFallback = !remoteEnabled || activeEngine === "local-fallback" || state === "fallback";
  const label = state === "synthesizing"
    ? `Synthesizing with ${isDeepInfra ? "DeepInfra Inworld" : "local fallback"}`
    : isDeepInfra
      ? "DeepInfra Inworld active"
      : isFallback
        ? "Local fallback active"
        : remoteEnabled
          ? "DeepInfra enabled · waiting"
          : "Local fallback selected";
  const dotClass = isDeepInfra ? "bg-emerald-500" : isFallback ? "bg-amber-500" : remoteEnabled ? "bg-sky-500" : "bg-slate-400";

  return (
    <div className="flex flex-wrap items-center gap-2" role="status" aria-live="polite" aria-label="Current TTS engine status">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass} ${state === "synthesizing" ? "animate-pulse" : ""}`} />
      <span className="text-sm font-semibold text-[#17324D]">{label}</span>
    </div>
  );
}

export default function DiscordTtsAdmin() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const statusQuery = trpc.discordTts.status.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 2_000,
    refetchIntervalInBackground: false,
  });
  const botStatusQuery = trpc.discordTts.botStatus.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 2_000,
    refetchIntervalInBackground: false,
  });
  const [remoteEnabled, setRemoteEnabled] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [speaker, setSpeaker] = useState("Ashley");
  const [instruct, setInstruct] = useState("Speak clearly and warmly, suitable for a church announcement.");
  const [speed, setSpeed] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const status = statusQuery.data;
  const configureMutation = trpc.discordTts.configure.useMutation({
    onSuccess: async (next) => {
      setRemoteEnabled(next.remoteEnabled);
      setApiKey("");
      setMessage("Discord TTS settings updated. The API key is never displayed or returned.");
      await statusQuery.refetch();
    },
    onError: (error) => setMessage(error.message),
  });
  const testMutation = trpc.discordTts.test.useMutation({
    onSuccess: async (result) => {
      setTestResult(`${result.engine === "deepinfra-inworld" ? "DeepInfra Inworld" : "Local fallback"} generated ${result.bytes.toLocaleString()} bytes in ${result.latencyMs} ms.`);
      await statusQuery.refetch();
    },
    onError: (error) => setTestResult(error.message),
  });
  const startBotMutation = trpc.discordTts.startBot.useMutation({ onSuccess: () => void botStatusQuery.refetch() });
  const pauseBotMutation = trpc.discordTts.pauseBot.useMutation({ onSuccess: () => void botStatusQuery.refetch() });
  const stopBotMutation = trpc.discordTts.stopBot.useMutation({ onSuccess: () => void botStatusQuery.refetch() });
  const retryMessageMutation = trpc.discordTts.retryLastMessage.useMutation({
    onSuccess: async (result) => {
      setMessage(result.message);
      await botStatusQuery.refetch();
    },
    onError: (error) => setMessage(`재시도하지 못했습니다: ${error.message}`),
  });

  if (authLoading) {
    return <div className="min-h-screen bg-[#F4F6F7]"><Navbar /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-[#17324D]" /></div><Footer /></div>;
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-[#F4F6F7]"><Navbar /><section className="py-32"><div className="container mx-auto max-w-md text-center"><LogIn className="mx-auto mb-5 text-[#17324D]" size={36} /><h1 className="mb-3 text-2xl font-bold text-[#17324D]">Sign In Required</h1><p className="mb-7 text-[#242A30]/65">Sign in with a church administrator account to manage Discord TTS.</p><Button onClick={() => startLogin()} className="bg-[#17324D] text-white hover:bg-[#245170]"><LogIn size={16} /> Sign In</Button></div></section><Footer /></div>;
  }

  if (!isAdmin) {
    return <div className="min-h-screen bg-[#F4F6F7]"><Navbar /><section className="py-32"><div className="container mx-auto max-w-md text-center"><ShieldAlert className="mx-auto mb-5 text-[#C9973E]" size={36} /><h1 className="mb-3 text-2xl font-bold text-[#17324D]">Staff Access Only</h1><p className="text-[#242A30]/65">Your account does not have administrator access.</p></div></section><Footer /></div>;
  }

  const effectiveRemoteEnabled = status?.remoteEnabled ?? remoteEnabled;
  const canUseDeepInfra = Boolean(status?.apiKeyConfigured);
  const activeEngine = status?.currentEngine ?? status?.lastEngine;
  const botStatus = botStatusQuery.data;

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />
      <BrandPageHero eyebrow="Church Staff" title="Discord TTS" description="Control the voice engine used for Admin's live worship text announcements." visual="community" />
      <main className="container mx-auto max-w-5xl space-y-6 py-12">
        <Card className="border-[#DCE4E7] bg-white shadow-sm">
          <CardHeader className="border-b border-[#E7EEF1]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#17324D]"><Radio size={20} className="text-[#C9973E]" /> Live engine status</CardTitle>
                <CardDescription className="mt-2">This status refreshes every two seconds while the dashboard is open.</CardDescription>
              </div>
              <StatusPill remoteEnabled={effectiveRemoteEnabled} currentEngine={status?.currentEngine ?? null} lastEngine={status?.lastEngine ?? null} state={status?.state ?? "ready"} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Remote API</p><p className="mt-1 font-semibold text-[#17324D]">{effectiveRemoteEnabled ? "Enabled" : "Disabled"}</p><p className="mt-1 text-xs text-[#607A91]">{canUseDeepInfra ? "Server key configured" : "Server key missing"}</p></div>
            <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Last engine</p><p className="mt-1 font-semibold text-[#17324D]">{status?.lastEngine === "deepinfra-inworld" ? "DeepInfra Inworld" : status?.lastEngine === "local-fallback" ? "Local fallback" : "Not used yet"}</p><p className="mt-1 text-xs text-[#607A91]">{status?.lastLatencyMs ? `${status.lastLatencyMs} ms` : "No synthesis yet"}</p></div>
            <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Requests</p><p className="mt-1 font-semibold text-[#17324D]">{status?.completedCount ?? 0} completed</p><p className="mt-1 text-xs text-[#607A91]">{status?.failedCount ?? 0} failed</p></div>
            <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Connection</p><p className="mt-1 flex items-center gap-1.5 font-semibold text-[#17324D]">{statusQuery.isFetching ? <Wifi size={15} className="text-sky-600" /> : <WifiOff size={15} className="text-[#607A91]" />}{statusQuery.isFetching ? "Live" : "Idle"}</p><p className="mt-1 truncate text-xs text-[#607A91]" title={status?.endpoint}>{status?.endpoint ?? "Loading…"}</p></div>
          </CardContent>
        </Card>

        <Card className="border-[#DCE4E7] bg-white shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#17324D]"><Wifi size={20} className="text-[#C9973E]" /> Discord voice runtime</CardTitle><CardDescription>Only messages from Admin in the configured text channel are accepted. Sentences are queued and played sequentially.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Bot state</p><p className="mt-1 font-semibold capitalize text-[#17324D]">{botStatus?.state === "reconnecting" ? "자동 재연결 중" : botStatus?.state ?? "Loading…"}</p><p className="mt-1 text-xs text-[#607A91]">{botStatus?.botUser ?? "Not connected"}</p></div>
              <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Queue</p><p className="mt-1 font-semibold text-[#17324D]">{botStatus?.queueDepth ?? 0} sentence(s)</p><p className="mt-1 truncate text-xs text-[#607A91]">{botStatus?.currentText ?? "Idle"}</p></div>
              <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Allowed sender</p><p className="mt-1 font-semibold text-[#17324D]">Admin only</p><p className="mt-1 text-xs text-[#607A91]">ID ending {botStatus?.allowedUserId?.slice(-4) ?? "…"}</p></div>
            </div>
            {botStatus?.lastError && <div className={`flex flex-col gap-3 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${botStatus.state === "reconnecting" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"}`} role="alert"><div className="flex min-w-0 items-start gap-2"><AlertTriangle className={`mt-0.5 shrink-0 ${botStatus.state === "reconnecting" ? "text-amber-600" : "text-red-600"}`} size={18} /><div><p className="font-semibold">{botStatus.state === "reconnecting" ? "Discord 음성 연결을 자동 복구하는 중입니다" : "음성 송출에 문제가 발생했습니다"}</p><p className="mt-1">{botStatus.lastError}</p>{botStatus.lastFailed?.text && <p className="mt-1 truncate text-xs text-red-700/80">실패한 문장: “{botStatus.lastFailed.text}”</p>}</div></div><Button variant="outline" onClick={() => retryMessageMutation.mutate()} disabled={retryMessageMutation.isPending || botStatus.state === "reconnecting" || (!botStatus.lastFailed && botStatus.lastErrorCode !== "connection_unavailable")} className="shrink-0 border-red-300 bg-white text-red-800 hover:bg-red-100">{retryMessageMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} {botStatus.state === "reconnecting" ? "자동 재연결 중" : botStatus.lastFailed ? "마지막 메시지 재시도" : "음성 연결 재시도"}</Button></div>}
            <div className="flex flex-wrap gap-3"><Button onClick={() => startBotMutation.mutate()} disabled={startBotMutation.isPending || botStatus?.state === "connected"} className="bg-[#17324D] text-white hover:bg-[#245170]">{startBotMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Wifi size={16} />} {botStatus?.state === "paused" ? "Resume bot" : "Start bot"}</Button><Button variant="outline" onClick={() => pauseBotMutation.mutate()} disabled={pauseBotMutation.isPending || botStatus?.state !== "connected"} className="border-[#DCE4E7] text-[#17324D]">{pauseBotMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Radio size={16} />} Pause queue</Button><Button variant="outline" onClick={() => stopBotMutation.mutate()} disabled={stopBotMutation.isPending || botStatus?.state === "stopped" || botStatus?.state === "disabled"} className="border-[#DCE4E7] text-[#17324D]">{stopBotMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <WifiOff size={16} />} Stop bot</Button></div>
            {botStatus?.history?.length ? <div className="overflow-x-auto rounded-lg border border-[#DCE4E7]"><table className="w-full min-w-[38rem] text-left text-sm"><thead className="bg-[#F4F6F7] text-xs uppercase tracking-wider text-[#607A91]"><tr><th className="px-4 py-3">Sentence</th><th className="px-4 py-3">Engine</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Latency</th></tr></thead><tbody>{botStatus.history.slice(0, 8).map((item) => <tr key={item.id} className="border-t border-[#E7EEF1]"><td className="max-w-[20rem] truncate px-4 py-3 text-[#17324D]">{item.text}</td><td className="px-4 py-3 text-[#607A91]">{item.engine === "deepinfra-inworld" ? "DeepInfra Inworld" : item.engine === "local-fallback" ? "Local fallback" : "—"}</td><td className="px-4 py-3 capitalize text-[#607A91]">{item.status}</td><td className="px-4 py-3 text-[#607A91]">{item.latencyMs ? `${item.latencyMs} ms` : "—"}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[#607A91]">No Discord sentences have been processed yet.</p>}
          </CardContent>
        </Card>

        <Card className="border-[#DCE4E7] bg-white shadow-sm">
          <CardHeader><CardTitle className="text-[#17324D]">DeepInfra Inworld remote TTS</CardTitle><CardDescription>Use Inworld Realtime TTS 1.5 Mini first, then fall back to the local engine if the remote request fails. The key input is write-only and held in server memory until restart; for persistence, use the project secret.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-[#DCE4E7] bg-[#FFFEFB] p-4">
              <div><p className="font-semibold text-[#17324D]">Enable remote TTS</p><p className="mt-1 text-sm text-[#607A91]">{effectiveRemoteEnabled ? "DeepInfra Inworld will be attempted before local fallback." : "Only the local fallback engine will be used."}</p></div>
              <Switch checked={effectiveRemoteEnabled} onCheckedChange={(checked) => { setRemoteEnabled(checked); configureMutation.mutate({ remoteEnabled: checked }); }} disabled={configureMutation.isPending} aria-label="Enable DeepInfra remote TTS" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[#17324D]" htmlFor="deepinfra-api-key">DeepInfra API key <span className="font-normal text-[#607A91]">(optional rotation)</span><Input id="deepinfra-api-key" type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={canUseDeepInfra ? "Server secret is configured" : "Paste a key for this session"} className="mt-2" /><span className="mt-1 block text-xs font-normal text-[#607A91]">Never shown in the dashboard or returned by the API.</span></label>
              <div className="space-y-5"><label className="block text-sm font-semibold text-[#17324D]" htmlFor="deepinfra-speaker">Speaker<Input id="deepinfra-speaker" value={speaker} onChange={(event) => setSpeaker(event.target.value)} className="mt-2" /></label><label className="block text-sm font-semibold text-[#17324D]" htmlFor="deepinfra-speed">Speed: {speed.toFixed(2)}x<input id="deepinfra-speed" type="range" min="0.75" max="1.5" step="0.05" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="mt-3 w-full accent-[#C9973E]" /><span className="mt-1 flex justify-between text-xs font-normal text-[#607A91]"><span>0.75x</span><span>1.5x</span></span></label></div>
            </div>
            <label className="block text-sm font-semibold text-[#17324D]" htmlFor="deepinfra-instruct">Voice style instruction<textarea id="deepinfra-instruct" value={instruct} onChange={(event) => setInstruct(event.target.value)} rows={3} className="mt-2 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" /></label>
            {message && <p className="rounded-md bg-[#F6F0E5] px-4 py-3 text-sm text-[#8A6420]" role="status">{message}</p>}
            {status?.lastError && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Last synthesis fallback reason: {status.lastError}</p>}
            <div className="flex flex-wrap items-center gap-3"><Button onClick={() => configureMutation.mutate({ remoteEnabled, apiKey: apiKey || undefined, speaker, instruct, speed })} disabled={configureMutation.isPending} className="bg-[#17324D] text-white hover:bg-[#245170]">{configureMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Volume2 size={16} />} Save TTS settings</Button><Button variant="outline" onClick={() => testMutation.mutate({ text: "Welcome to Graceway Baptist Church." })} disabled={testMutation.isPending} className="border-[#B9955E]/50 text-[#17324D]">{testMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Radio size={16} />} Test short sentence</Button><Badge variant="outline" className="border-[#DCE4E7] text-[#607A91]">Current: {activeEngine === "deepinfra-inworld" ? "DeepInfra Inworld" : activeEngine === "local-fallback" ? "Local fallback" : "Waiting"}</Badge></div>
            {testResult && <p className="rounded-md bg-[#EDF5EE] px-4 py-3 text-sm text-[#315C3A]" role="status">{testResult}</p>}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
