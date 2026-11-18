import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface DiscordTranscriptControlsProps {
  runtime?: { state: string; queueDepth: number; currentText: string | null };
  onQueued: () => void;
}

type Run = {
  id: string; paragraphIndex: number;
  status: "queued" | "playing" | "completed" | "failed" | "cancelled" | "interrupted";
  sentenceCount: number; completedCount: number; error: string | null;
};
type Transcript = {
  id: number; title: string; filename: string | null; paragraphs: string[];
  nextParagraph: number; createdAt: number; updatedAt: number; lastRun: Run | null;
};
type Attempt = { id: number; index: number; requestId: string; replay: boolean };
type Admission = { id: number; index: number; batchId: string; sentenceCount: number };
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const fileTypes: Record<string, string> = {
  txt: "text/plain", md: "text/markdown",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};
const activeRun = (run: Run | null | undefined) => run?.status === "queued" || run?.status === "playing";
const paragraphKey = (id: number, index: number) => `${id}:${index}`;
const clampIndex = (index: number, count: number) => Math.max(0, Math.min(index, count - 1));
const statusLabels: Record<Run["status"], string> = {
  queued: "대기 중 / Queued", playing: "재생 중 / Playing", completed: "문단 완료 / Paragraph completed",
  failed: "실패 / Failed", cancelled: "취소됨 / Cancelled", interrupted: "중단됨 / Interrupted",
};

export default function DiscordTranscriptControls({ runtime, onQueued }: DiscordTranscriptControlsProps) {
  const utils = trpc.useUtils();
  const list = trpc.discordTranscript.list.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [imported, setImported] = useState<Transcript | null>(null);
  const detail = trpc.discordTranscript.get.useQuery(
    { id: selectedId ?? 0 }, { enabled: !!selectedId, refetchInterval: 2000 },
  );
  const importText = trpc.discordTranscript.importText.useMutation();
  const importFile = trpc.discordTranscript.importFile.useMutation();
  const send = trpc.discordTranscript.sendParagraph.useMutation();
  const remove = trpc.discordTranscript.delete.useMutation();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [replayTarget, setReplayTarget] = useState<{ id: number; index: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const sendGuard = useRef(false);
  const importGuard = useRef(false);
  const deleteGuard = useRef(false);
  const readerRef = useRef<FileReader | null>(null);
  const attemptRef = useRef<Attempt | null>(null);
  const admissionRef = useRef<Admission | null>(null);
  const attempted = useRef(new Set<string>());
  const observed = useRef<{ id: number; next: number; completedRun: string | null } | null>(null);
  const doc: Transcript | null = detail.data?.id === selectedId ? detail.data : imported?.id === selectedId ? imported : null;
  const run = doc?.lastRun;
  const localAdmission = admission?.id === selectedId ? admission : null;
  const runBusy = activeRun(run) || !!localAdmission;
  const mutationBusy = sending || send.isPending || deleting || remove.isPending;
  const runtimeBusy = (runtime?.queueDepth ?? 0) > 0 || !!runtime?.currentText;
  const sendDisabled = !doc?.paragraphs.length || runtime?.state !== "connected" || runtimeBusy || runBusy || mutationBusy || !!detail.error;
  const deleteDisabled = !doc || runBusy || mutationBusy || !!detail.error;
  const needsReplay = !!doc && (
    index < doc.nextParagraph || run?.paragraphIndex === index || attempted.current.has(paragraphKey(doc.id, index))
  );

  useEffect(() => () => {
    if (readerRef.current?.readyState === FileReader.LOADING) readerRef.current.abort();
  }, []);

  // Polling may highlight the saved next paragraph, but it NEVER queues speech.
  // Preserve navigation away from the completed paragraph while a batch runs.
  useEffect(() => {
    if (!doc) return;
    const prior = observed.current;
    if (!prior || prior.id !== doc.id) {
      setIndex(clampIndex(doc.nextParagraph, doc.paragraphs.length));
    } else if (doc.lastRun?.status === "completed" && doc.nextParagraph > prior.next) {
      const finishedIndex = doc.lastRun.paragraphIndex;
      setIndex(current => current === finishedIndex ? clampIndex(doc.nextParagraph, doc.paragraphs.length) : current);
    }
    observed.current = {
      id: doc.id,
      // Only completion may advance the observed success cursor.
      next: !prior || prior.id !== doc.id || doc.lastRun?.status === "completed" ? doc.nextParagraph : prior.next,
      completedRun: doc.lastRun?.status === "completed" ? doc.lastRun.id : prior && prior.id === doc.id ? prior.completedRun : null,
    };
    const pending = admissionRef.current;
    if (pending && pending.id === doc.id && doc.lastRun?.id === pending.batchId && !activeRun(doc.lastRun)) {
      admissionRef.current = null;
      setAdmission(null);
    }
  }, [doc]);

  function refresh(id?: number) {
    void utils.discordTranscript.list.invalidate();
    if (id) void utils.discordTranscript.get.invalidate({ id });
  }
  function importedSuccessfully(next: Transcript & { warnings: string[] }) {
    importGuard.current = false;
    setImporting(false);
    setImported(next);
    setSelectedId(next.id);
    setIndex(clampIndex(next.nextParagraph, next.paragraphs.length));
    observed.current = { id: next.id, next: next.nextParagraph, completedRun: next.lastRun?.status === "completed" ? next.lastRun.id : null };
    setWarnings(next.warnings);
    setError(null);
    setSendError(null);
    setText("");
    refresh(next.id);
  }
  function importFailed(failure: { message: string }) {
    importGuard.current = false;
    setImporting(false);
    setError(failure.message);
  }
  function pasteImport() {
    if (importGuard.current || !text.trim()) return;
    importGuard.current = true;
    setImporting(true);
    setError(null);
    setWarnings([]);
    importText.mutate({ title: title.trim() || "Sermon transcript", text }, { onSuccess: importedSuccessfully, onError: importFailed });
  }
  function chooseFile(file?: File) {
    if (!file || importGuard.current) return;
    setError(null);
    setWarnings([]);
    if (file.size > MAX_FILE_BYTES) {
      setError("파일은 최대 2 MiB입니다. / File limit: 2 MiB.");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!fileTypes[extension]) {
      setError(".txt, .md, .docx, .pdf만 지원합니다. / Unsupported file type.");
      return;
    }
    importGuard.current = true;
    setImporting(true);
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onerror = () => importFailed({ message: "파일을 읽지 못했습니다. / Could not read file." });
    reader.onabort = () => { importGuard.current = false; setImporting(false); };
    reader.onload = () => {
      const result = reader.result;
      const marker = ";base64,";
      if (typeof result !== "string" || !result.includes(marker)) {
        importFailed({ message: "파일 읽기 형식 오류 / Invalid file data." });
        return;
      }
      importFile.mutate({
        title: title.trim() || file.name.replace(/\.[^.]+$/, ""), filename: file.name,
        mimeType: file.type || fileTypes[extension], base64: result.slice(result.indexOf(marker) + marker.length),
      }, { onSuccess: importedSuccessfully, onError: importFailed });
    };
    try { reader.readAsDataURL(file); }
    catch { importFailed({ message: "파일을 읽지 못했습니다. / Could not read file." }); }
  }
  function selectDocument(id: number | null) {
    setSelectedId(id);
    setIndex(0);
    observed.current = null;
    setSendError(null);
    setReplayTarget(null);
    setDeleteTarget(null);
  }
  function sendAttempt(target: { id: number; index: number }, replay: boolean, retry = false) {
    // The synchronous guard also protects two clicks before React renders disabled state.
    if (sendGuard.current || deleteGuard.current || sendDisabled || admissionRef.current?.id === target.id || doc?.id !== target.id) return;
    if (target.index < 0 || target.index >= doc.paragraphs.length) return;
    const previous = attemptRef.current;
    const attempt: Attempt = retry && previous?.id === target.id && previous.index === target.index
      ? previous : { ...target, requestId: crypto.randomUUID(), replay };
    sendGuard.current = true;
    attemptRef.current = attempt;
    attempted.current.add(paragraphKey(target.id, target.index));
    setSending(true);
    setSendError(null);
    send.mutate(attempt, {
      onSuccess: result => {
        const accepted = { id: target.id, index: result.paragraphIndex, batchId: result.batchId, sentenceCount: result.sentenceCount };
        const terminal = result.status && !["queued", "playing"].includes(result.status);
        admissionRef.current = terminal ? null : accepted;
        setAdmission(terminal ? null : accepted);
        attemptRef.current = null;
        sendGuard.current = false;
        setSending(false);
        refresh(target.id);
        onQueued();
      },
      onError: failure => {
        // Keep the original UUID and payload for an explicit, idempotent timeout retry.
        sendGuard.current = false;
        setSending(false);
        setSendError(failure.message);
        refresh(target.id);
      },
    });
  }
  function requestSend() {
    if (sendGuard.current || sendDisabled || !doc) return;
    if (needsReplay) setReplayTarget({ id: doc.id, index });
    else sendAttempt({ id: doc.id, index }, false);
  }
  function confirmDelete() {
    if (!deleteTarget || deleteGuard.current || sendGuard.current || deleteDisabled || admissionRef.current?.id === deleteTarget.id || doc?.id !== deleteTarget.id) return;
    const id = deleteTarget.id;
    deleteGuard.current = true;
    setDeleting(true);
    setError(null);
    remove.mutate({ id }, {
      onSuccess: () => {
        deleteGuard.current = false;
        setDeleting(false);
        selectDocument(null);
        setImported(null);
        setWarnings([]);
        refresh(id);
      },
      onError: failure => { deleteGuard.current = false; setDeleting(false); setError(failure.message); refresh(id); },
    });
  }

  const selectedRun = run?.paragraphIndex === index ? run : null;
  const runFailed = run && ["failed", "cancelled", "interrupted"].includes(run.status);
  const retry = attemptRef.current;
  const selectClass = "mt-2 h-11 w-full rounded-md border border-[#DCE4E7] bg-white px-3 text-sm text-[#17324D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9973E] disabled:opacity-50";
  return <section aria-label="원고 문단 송출 / Transcript controls" className="space-y-4 rounded-xl border border-[#DCE4E7] bg-[#F4F6F7] p-4 text-[#17324D] sm:p-6">
    <header>
      <h3 className="text-lg font-semibold">원고 문단 송출 / Transcript</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#607A91]">가져오기·선택·새로고침은 송출하지 않습니다. 매 문단을 직접 송출하세요. / Importing, selecting, or refreshing never sends speech.</p>
    </header>
    <p className="rounded-md border-l-4 border-[#C9973E] bg-white p-3 text-xs leading-relaxed">추출된 원고는 교역자·스태프 전용으로 저장됩니다. 원본 파일은 저장하지 않습니다. / Parsed text is private to staff; the raw file is not stored.</p>
    <details className="rounded-lg bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold">원고 가져오기 / Import transcript</summary>
      <div className="mt-3 space-y-3">
        <label className="block text-sm" htmlFor="transcript-title">제목 (선택) / Title (optional)<Input id="transcript-title" value={title} onChange={e => setTitle(e.target.value)} disabled={importing} className="mt-1" /></label>
        <label className="block text-sm" htmlFor="transcript-file">파일 / File · .txt .md .docx .pdf · 최대 2 MiB<Input id="transcript-file" type="file" accept=".txt,.md,.docx,.pdf" disabled={importing || importFile.isPending || importText.isPending} className="mt-1 h-auto min-h-11" onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; chooseFile(file); }} /></label>
        <label className="block text-sm" htmlFor="transcript-paste">또는 텍스트 붙여넣기 / Or paste text<Textarea id="transcript-paste" value={text} onChange={e => setText(e.target.value)} disabled={importing} placeholder="빈 줄로 문단을 나누세요. / Separate paragraphs with blank lines." className="mt-1 min-h-28" /></label>
        <Button variant="outline" onClick={pasteImport} disabled={importing || importText.isPending || importFile.isPending || !text.trim()}>텍스트 가져오기 / Import text</Button>
        {importing && <p role="status" className="text-sm">읽기·가져오는 중… / Reading & importing…</p>}
      </div>
    </details>
    {warnings.length > 0 && <ul role="status" className="space-y-1 rounded-md bg-amber-50 p-3 text-xs text-amber-900">{warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>}
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">가져오기·삭제 오류 / Import or delete error: {error}</p>}
    <label htmlFor="transcript-document" className="block text-sm font-semibold">저장된 원고 / Saved transcript
      <select id="transcript-document" className={selectClass} value={selectedId ?? ""} onChange={e => selectDocument(e.target.value ? Number(e.target.value) : null)} disabled={mutationBusy || !!replayTarget || !!deleteTarget}>
        <option value="">원고 선택 / Choose transcript</option>
        {(list.data ?? []).map(item => <option key={item.id} value={item.id}>{item.title} · {item.paragraphCount} 문단 / paragraphs</option>)}
        {imported && !(list.data ?? []).some(item => item.id === imported.id) && <option value={imported.id}>{imported.title} · {imported.paragraphs.length} 문단 / paragraphs</option>}
      </select>
    </label>
    {list.isPending && <p role="status" className="text-xs">목록 불러오는 중… / Loading transcripts…</p>}
    {list.error && <div role="alert" className="text-sm text-red-800">목록 오류 / List error: {list.error.message} <Button variant="outline" size="sm" onClick={() => void list.refetch()}>목록 다시 조회 / Reload list</Button></div>}
    {selectedId && !doc && !detail.error && <p role="status" className="text-sm">원고 불러오는 중… / Loading transcript…</p>}
    {detail.error && selectedId && <div role="alert" className="text-sm text-red-800">원고 조회 오류 / Transcript error: {detail.error.message} <Button variant="outline" size="sm" onClick={() => void detail.refetch()}>다시 조회 / Reload</Button></div>}
    {doc && <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">문단 {doc.paragraphs.length ? index + 1 : 0} / {doc.paragraphs.length} · Paragraph</p>
        <Button variant="outline" size="sm" className="text-red-800" disabled={deleteDisabled} onClick={() => setDeleteTarget({ id: doc.id, title: doc.title })}>원고 삭제 / Delete transcript</Button>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] items-end gap-2">
        <Button variant="outline" className="h-11" disabled={index === 0 || !doc.paragraphs.length || !!replayTarget || !!deleteTarget} onClick={() => setIndex(current => current - 1)}>이전 / Prev</Button>
        <label className="min-w-0 text-xs" htmlFor="transcript-paragraph">문단 선택 / Choose paragraph<select id="transcript-paragraph" className={selectClass} value={index} disabled={!doc.paragraphs.length || !!replayTarget || !!deleteTarget} onChange={e => setIndex(Number(e.target.value))}>{doc.paragraphs.map((_, i) => <option value={i} key={i}>{i + 1} / {doc.paragraphs.length}{i < doc.nextParagraph ? " · 저장된 성공 범위 / Saved success" : ""}</option>)}</select></label>
        <Button variant="outline" className="h-11" disabled={index >= doc.paragraphs.length - 1 || !!replayTarget || !!deleteTarget} onClick={() => setIndex(current => current + 1)}>다음 / Next</Button>
      </div>
      <div aria-label="현재 문단 / Current paragraph" tabIndex={0} className={`max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border bg-white p-4 text-sm leading-relaxed ${selectedRun?.status === "completed" ? "border-emerald-500" : selectedRun && ["failed", "cancelled", "interrupted"].includes(selectedRun.status) ? "border-red-400" : "border-[#C9973E]"}`}>{doc.paragraphs[index] ?? "빈 원고 / Empty transcript"}</div>
      {index + 1 < doc.paragraphs.length && <details key={`${doc.id}:${index}`} className="rounded-md bg-white p-3 text-xs"><summary className="cursor-pointer font-semibold">다음 문단 미리보기 / Next paragraph preview</summary><p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed text-[#607A91]">{doc.paragraphs[index + 1]}</p></details>}
      {run && <div role="status" aria-live="polite" className={`rounded-lg p-3 text-sm ${run.status === "completed" ? "bg-emerald-50 text-emerald-900" : runFailed ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>
        <p className="font-semibold">문단 {run.paragraphIndex + 1} · {statusLabels[run.status]}</p>
        <p>문장 진행 / Sentences: {run.completedCount} / {run.sentenceCount}</p>
        {runFailed && <p className="mt-2 text-xs leading-relaxed">{run.error && <span>{run.error} · </span>}완료되지 않았습니다. 재송출은 문단 전체를 반복하며 이미 들은 문장도 다시 나올 수 있습니다. / Not completed; replay repeats the entire paragraph, including sentences already heard.</p>}
        {runFailed && <Button variant="outline" size="sm" className="mt-2" disabled={sendDisabled} onClick={() => setReplayTarget({ id: doc.id, index: run.paragraphIndex })}>실패 문단 다시 송출 / Replay unfinished paragraph</Button>}
      </div>}
      {localAdmission && run?.id !== localAdmission.batchId && <p role="status" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">문단 {localAdmission.index + 1} 대기열 접수 · {localAdmission.sentenceCount} 문장. 아직 완료되지 않았습니다. / Queued; not completed.</p>}
      {doc.nextParagraph >= doc.paragraphs.length && doc.paragraphs.length > 0 && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">원고 끝 / End of transcript. 저장된 성공 위치가 끝에 도달했습니다. 이전 문단은 확인 후 재송출할 수 있습니다. / Saved success cursor reached the end; earlier paragraphs remain available for confirmed replay.</p>}
      <p className="text-xs text-[#607A91]">저장된 다음 위치 / Saved next: {doc.nextParagraph >= doc.paragraphs.length ? "끝 / End" : doc.nextParagraph + 1}. 성공 위치는 가장 먼 완료 문단 기준이며, 수동 이동은 자유입니다. / Highest successful position; navigation does not send.</p>
      <Button className="h-auto min-h-11 w-full whitespace-normal bg-[#17324D] text-white hover:bg-[#245170]" disabled={sendDisabled} onClick={requestSend}>현재 문단 송출 / Send paragraph</Button>
      <p className="text-xs text-[#607A91]">{runtime?.state !== "connected" ? "봇 연결 후 송출할 수 있습니다. / Connect the bot to send." : runtimeBusy || runBusy || sending ? "현재 재생·대기열이 끝난 후 송출하세요. / Wait for playback and queue to finish." : needsReplay ? "이 문단은 재송출 확인이 필요합니다. / This paragraph requires replay confirmation." : "선택한 문단 하나만 송출합니다. / Sends only the selected paragraph."}</p>
      {sendError && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800"><p>송출 요청 오류 / Send request error: {sendError}</p><p className="mt-1 text-xs">응답 실패는 재생 실패를 뜻하지 않습니다. 같은 요청 재시도는 동일 ID를 사용합니다. / A lost response does not mean playback failed; retry uses the same request ID.</p>{retry && retry.id === doc.id && <Button variant="outline" className="mt-2" disabled={sendDisabled} onClick={() => sendAttempt({ id: retry.id, index: retry.index }, retry.replay, true)}>같은 요청 재시도 / Retry same request</Button>}</div>}
    </div>}
    <AlertDialog open={!!replayTarget} onOpenChange={open => { if (!open) setReplayTarget(null); }}>
      <AlertDialogContent className="text-[#17324D]">
        <AlertDialogHeader><AlertDialogTitle>문단 {replayTarget ? replayTarget.index + 1 : ""} 전체 재송출 / Replay entire paragraph?</AlertDialogTitle><AlertDialogDescription>문단 전체를 처음부터 다시 송출합니다. 이미 들은 문장도 반복될 수 있습니다. / The whole paragraph starts again, including any sentences already heard.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>취소 / Cancel</AlertDialogCancel><AlertDialogAction className="bg-[#17324D] hover:bg-[#245170]" disabled={sendDisabled} onClick={() => { if (replayTarget) sendAttempt(replayTarget, true); }}>전체 재송출 확인 / Confirm replay</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
      <AlertDialogContent className="text-[#17324D]">
        <AlertDialogHeader><AlertDialogTitle>저장된 원고 삭제 / Delete saved transcript?</AlertDialogTitle><AlertDialogDescription>“{deleteTarget?.title}”의 저장된 텍스트와 진행 기록을 삭제합니다. 되돌릴 수 없습니다. 활성 송출 중에는 삭제할 수 없습니다. / Removes saved text and progress permanently; unavailable during an active run.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>취소 / Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-700 hover:bg-red-800" disabled={deleteDisabled} onClick={confirmDelete}>삭제 확인 / Confirm delete</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}
