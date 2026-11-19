import { TRPCError } from "@trpc/server";
import { prepareTranscriptFeed } from "../shared/discordTranscriptFeed";
import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import { deleteDiscordTranscript, getDiscordTranscript, getDiscordTranscriptRun, getLatestDiscordTranscriptRun, insertDiscordTranscript, insertDiscordTranscriptRun, listDiscordTranscripts, updateDiscordTranscriptRun } from "./db";
import { getDiscordBotStatus, getDiscordParagraphBatch, queueDiscordTranscriptParagraph, type ParagraphBatch } from "./discordBot";
import { parseTranscriptText, parseTranscriptUpload, TRANSCRIPT_MAX_CHARS, TRANSCRIPT_MAX_BYTES } from "./discordTranscriptParser";

// Single Reserved process: serialize admission/delete, never block audio on DB writes.
let admission: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const result = admission.then(fn, fn);
  admission = result.catch(() => undefined);
  return result;
}
const progressWrites = new Map<string, Promise<void>>();
let progressError: string | null = null;
function saveProgress(batch: ParagraphBatch) {
  const previous = progressWrites.get(batch.id) ?? Promise.resolve();
  const writing = previous.then(() => updateDiscordTranscriptRun(batch.id, { status: batch.status, completedCount: batch.completedCount, error: batch.error }, batch.status === "completed" ? { id: batch.transcriptId, next: batch.paragraphIndex + 1 } : undefined)).then(() => { progressError = null; }).catch(() => { progressError = "송출 진행 기록을 저장하지 못했습니다. 페이지를 나가기 전 완료 상태를 확인해 주세요."; });
  progressWrites.set(batch.id, writing);
  void writing.then(() => { if (progressWrites.get(batch.id) === writing) progressWrites.delete(batch.id); });
}
async function requireTranscript(id: number) {
  const transcript = await getDiscordTranscript(id);
  if (!transcript) throw new TRPCError({ code: "NOT_FOUND", message: "저장된 원고를 찾을 수 없습니다." });
  return transcript;
}
function resolvedRun(run: Awaited<ReturnType<typeof getLatestDiscordTranscriptRun>>) {
  if (!run) return null;
  const live = getDiscordParagraphBatch(run.id);
  if (live) return { id: run.id, paragraphIndex: run.paragraphIndex, status: live.status, sentenceCount: live.sentenceCount, completedCount: live.completedCount, error: live.error ?? progressError };
  const incomplete = run.status === "queued" || run.status === "playing";
  return { id: run.id, paragraphIndex: run.paragraphIndex, status: incomplete ? "interrupted" as const : run.status, sentenceCount: run.sentenceCount, completedCount: run.completedCount, error: incomplete ? "서버 연결 또는 재시작으로 이전 송출 상태를 확인할 수 없습니다. 자동 재송출하지 않습니다. 이미 들린 부분이 있을 수 있으므로 문단 재송출을 확인해 주세요." : run.error };
}
async function documentView(id: number) {
  const transcript = await requireTranscript(id);
  return { id: transcript.id, title: transcript.title, filename: transcript.filename, paragraphs: transcript.paragraphs, nextParagraph: transcript.nextParagraph, createdAt: transcript.createdAt, updatedAt: transcript.updatedAt, lastRun: resolvedRun(await getLatestDiscordTranscriptRun(id)) };
}
function requireIdle() {
  const state = getDiscordBotStatus();
  if (state.state !== "connected") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Start bot으로 음성 연결을 먼저 시작해 주세요." });
  if (state.currentText || state.queueDepth) throw new TRPCError({ code: "CONFLICT", message: "현재 송출이 끝난 뒤 다음 문단을 송출해 주세요." });
  return state;
}
const title = z.string().trim().min(1).max(200);
const documentId = z.object({ id: z.number().int().positive() });
export const discordTranscriptRouter = router({
  list: adminProcedure.query(() => listDiscordTranscripts()),
  get: adminProcedure.input(documentId).query(({ input }) => documentView(input.id)),
  importText: adminProcedure.input(z.object({ title, text: z.string().min(1).max(TRANSCRIPT_MAX_CHARS) })).mutation(async ({ input, ctx }) => {
    let paragraphs: string[];
    try { paragraphs = parseTranscriptText(input.text); }
    catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "문단을 확인해 주세요." }); }
    const saved = await insertDiscordTranscript({ title: input.title, filename: null, paragraphs, createdBy: ctx.user.id });
    if (!saved) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "원고를 저장하지 못했습니다." });
    return { ...await documentView(saved.id), warnings: [] as string[] };
  }),
  importFile: adminProcedure.input(z.object({ title, filename: z.string().min(1).max(255).refine(v => !/[\u0000\r\n]/.test(v)), mimeType: z.string().max(128), base64: z.string().min(1).max(Math.ceil(TRANSCRIPT_MAX_BYTES / 3) * 4 + 4) })).mutation(async ({ input, ctx }) => {
    let parsed: Awaited<ReturnType<typeof parseTranscriptUpload>>;
    try { parsed = await parseTranscriptUpload(input); }
    catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message.slice(0, 500) : "파일을 읽을 수 없습니다." }); }
    const filename = input.filename.replace(/^.*[\\/]/, "");
    const saved = await insertDiscordTranscript({ title: input.title, filename, paragraphs: parsed.paragraphs, createdBy: ctx.user.id });
    if (!saved) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "원고를 저장하지 못했습니다." });
    return { ...await documentView(saved.id), warnings: parsed.warnings };
  }),
  sendParagraph: adminProcedure.input(z.object({ id: z.number().int().positive(), index: z.number().int().nonnegative(), requestId: z.string().uuid(), replay: z.boolean().default(false) })).mutation(({ input, ctx }) => serialize(async () => {
    const transcript = await requireTranscript(input.id);
    if (input.index >= transcript.paragraphs.length) throw new TRPCError({ code: "BAD_REQUEST", message: "원고의 문단 번호를 확인해 주세요." });
    const duplicate = await getDiscordTranscriptRun(input.requestId);
    if (duplicate) {
      if (duplicate.transcriptId !== input.id || duplicate.paragraphIndex !== input.index) throw new TRPCError({ code: "CONFLICT", message: "다른 문단에 사용된 송출 요청입니다." });
      return { batchId: duplicate.id, paragraphIndex: duplicate.paragraphIndex, sentenceCount: duplicate.sentenceCount, status: resolvedRun(duplicate)!.status };
    }
    const previousRun = await getLatestDiscordTranscriptRun(input.id, input.index);
    if (!input.replay && (previousRun || input.index < transcript.nextParagraph)) throw new TRPCError({ code: "CONFLICT", message: "이미 요청한 문단입니다. 전체 문단 재송출 확인을 선택해 주세요." });
    const state = requireIdle();
    let text: string;
    try { text = prepareTranscriptFeed(transcript.paragraphs[input.index]); }
    catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "문단을 확인해 주세요." }); }
    const sentenceCount = 1;
    const now = Date.now();
    await insertDiscordTranscriptRun({ id: input.requestId, transcriptId: input.id, paragraphIndex: input.index, status: "queued", sentenceCount, completedCount: 0, error: null, runtimeId: state.instanceId, requestedBy: ctx.user.id, createdAt: now, updatedAt: now });
    try {
      queueDiscordTranscriptParagraph({ id: input.requestId, transcriptId: input.id, paragraphIndex: input.index, text }, saveProgress);
    } catch (error) {
      await updateDiscordTranscriptRun(input.requestId, { status: "failed", completedCount: 0, error: "문단이 송출 대기열에 들어가지 못했습니다. 연결·대기열을 확인해 주세요." });
      throw new TRPCError({ code: "CONFLICT", message: error instanceof Error ? error.message : "문단을 송출하지 못했습니다." });
    }
    return { batchId: input.requestId, paragraphIndex: input.index, sentenceCount, status: "queued" as const };
  })),
  delete: adminProcedure.input(documentId).mutation(({ input }) => serialize(async () => {
    await requireTranscript(input.id);
    const run = await getLatestDiscordTranscriptRun(input.id);
    const live = run && getDiscordParagraphBatch(run.id);
    if (live && (live.status === "queued" || live.status === "playing")) throw new TRPCError({ code: "CONFLICT", message: "송출 중인 원고는 삭제할 수 없습니다. 먼저 송출을 중지해 주세요." });
    if (run) await progressWrites.get(run.id);
    await deleteDiscordTranscript(input.id);
    return { deleted: true as const };
  })),
});
