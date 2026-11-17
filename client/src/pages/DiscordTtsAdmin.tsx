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
import { Loader2, LogIn, Radio, ShieldAlert, Volume2, Wifi, WifiOff } from "lucide-react";

function StatusPill({ remoteEnabled, currentEngine, lastEngine, state }: { remoteEnabled: boolean; currentEngine: string | null; lastEngine: string | null; state: string }) {
  const activeEngine = currentEngine ?? lastEngine;
  const isDeepInfra = remoteEnabled && activeEngine === "deepinfra-qwen";
  const isFallback = !remoteEnabled || activeEngine === "local-fallback" || state === "fallback";
  const label = state === "synthesizing"
    ? `Synthesizing with ${isDeepInfra ? "DeepInfra Qwen" : "local fallback"}`
    : isDeepInfra
      ? "DeepInfra Qwen active"
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
  const [remoteEnabled, setRemoteEnabled] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [speaker, setSpeaker] = useState("Aiden");
  const [instruct, setInstruct] = useState("Speak clearly and warmly, suitable for a church announcement.");
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
      setTestResult(`${result.engine === "deepinfra-qwen" ? "DeepInfra Qwen" : "Local fallback"} generated ${result.bytes.toLocaleString()} bytes in ${result.latencyMs} ms.`);
      await statusQuery.refetch();
    },
    onError: (error) => setTestResult(error.message),
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

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar />
      <BrandPageHero eyebrow="Church Staff" title="Discord TTS" description="Control the voice engine used for Kee's live worship text announcements." visual="community" />
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
            <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Last engine</p><p className="mt-1 font-semibold text-[#17324D]">{status?.lastEngine === "deepinfra-qwen" ? "DeepInfra Qwen" : status?.lastEngine === "local-fallback" ? "Local fallback" : "Not used yet"}</p><p className="mt-1 text-xs text-[#607A91]">{status?.lastLatencyMs ? `${status.lastLatencyMs} ms` : "No synthesis yet"}</p></div>
            <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Requests</p><p className="mt-1 font-semibold text-[#17324D]">{status?.completedCount ?? 0} completed</p><p className="mt-1 text-xs text-[#607A91]">{status?.failedCount ?? 0} failed</p></div>
            <div className="rounded-lg bg-[#F4F6F7] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#607A91]">Connection</p><p className="mt-1 flex items-center gap-1.5 font-semibold text-[#17324D]">{statusQuery.isFetching ? <Wifi size={15} className="text-sky-600" /> : <WifiOff size={15} className="text-[#607A91]" />}{statusQuery.isFetching ? "Live" : "Idle"}</p><p className="mt-1 truncate text-xs text-[#607A91]" title={status?.endpoint}>{status?.endpoint ?? "Loading…"}</p></div>
          </CardContent>
        </Card>

        <Card className="border-[#DCE4E7] bg-white shadow-sm">
          <CardHeader><CardTitle className="text-[#17324D]">DeepInfra Qwen remote TTS</CardTitle><CardDescription>Use DeepInfra first, then fall back to the local engine if the remote request fails. The key input is write-only and held in server memory until restart; for persistence, use the project secret.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-[#DCE4E7] bg-[#FFFEFB] p-4">
              <div><p className="font-semibold text-[#17324D]">Enable remote TTS</p><p className="mt-1 text-sm text-[#607A91]">{effectiveRemoteEnabled ? "DeepInfra will be attempted before local fallback." : "Only the local fallback engine will be used."}</p></div>
              <Switch checked={effectiveRemoteEnabled} onCheckedChange={(checked) => { setRemoteEnabled(checked); configureMutation.mutate({ remoteEnabled: checked }); }} disabled={configureMutation.isPending} aria-label="Enable DeepInfra remote TTS" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[#17324D]" htmlFor="deepinfra-api-key">DeepInfra API key <span className="font-normal text-[#607A91]">(optional rotation)</span><Input id="deepinfra-api-key" type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={canUseDeepInfra ? "Server secret is configured" : "Paste a key for this session"} className="mt-2" /><span className="mt-1 block text-xs font-normal text-[#607A91]">Never shown in the dashboard or returned by the API.</span></label>
              <label className="block text-sm font-semibold text-[#17324D]" htmlFor="deepinfra-speaker">Speaker<Input id="deepinfra-speaker" value={speaker} onChange={(event) => setSpeaker(event.target.value)} className="mt-2" /></label>
            </div>
            <label className="block text-sm font-semibold text-[#17324D]" htmlFor="deepinfra-instruct">Voice style instruction<textarea id="deepinfra-instruct" value={instruct} onChange={(event) => setInstruct(event.target.value)} rows={3} className="mt-2 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" /></label>
            {message && <p className="rounded-md bg-[#F6F0E5] px-4 py-3 text-sm text-[#8A6420]" role="status">{message}</p>}
            {status?.lastError && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Last synthesis fallback reason: {status.lastError}</p>}
            <div className="flex flex-wrap items-center gap-3"><Button onClick={() => configureMutation.mutate({ remoteEnabled, apiKey: apiKey || undefined, speaker, instruct })} disabled={configureMutation.isPending} className="bg-[#17324D] text-white hover:bg-[#245170]">{configureMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Volume2 size={16} />} Save TTS settings</Button><Button variant="outline" onClick={() => testMutation.mutate({ text: "Welcome to Graceway Baptist Church." })} disabled={testMutation.isPending} className="border-[#B9955E]/50 text-[#17324D]">{testMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Radio size={16} />} Test short sentence</Button><Badge variant="outline" className="border-[#DCE4E7] text-[#607A91]">Current: {activeEngine === "deepinfra-qwen" ? "DeepInfra Qwen" : activeEngine === "local-fallback" ? "Local fallback" : "Waiting"}</Badge></div>
            {testResult && <p className="rounded-md bg-[#EDF5EE] px-4 py-3 text-sm text-[#315C3A]" role="status">{testResult}</p>}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
