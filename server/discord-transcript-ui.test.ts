// @vitest-environment jsdom
// Use the repository's existing React DOM/Vitest harness; no renderer dependency is added.
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Run = {
  id: string; paragraphIndex: number;
  status: "queued" | "playing" | "completed" | "failed" | "cancelled" | "interrupted";
  sentenceCount: number; completedCount: number; error: string | null;
};
type Doc = {
  id: number; title: string; filename: string | null; paragraphs: string[];
  nextParagraph: number; createdAt: number; updatedAt: number; lastRun: Run | null;
};
type Payload = { id: number; index: number; requestId: string; replay: boolean };
type SendCallbacks = {
  onSuccess: (value: { batchId: string; paragraphIndex: number; sentenceCount: number }) => void;
  onError: (error: Error) => void;
};
type ImportCallbacks = {
  onSuccess: (value: Doc & { warnings: string[] }) => void;
  onError: (error: Error) => void;
};
const mocks = vi.hoisted(() => ({
  docs: [] as Doc[], listError: null as Error | null, getError: null as Error | null,
  send: vi.fn(), importText: vi.fn(), importFile: vi.fn(), remove: vi.fn(),
  invalidateList: vi.fn().mockResolvedValue(undefined), invalidateGet: vi.fn().mockResolvedValue(undefined),
  refetch: vi.fn().mockResolvedValue(undefined), query: vi.fn(), queued: vi.fn(), uuid: vi.fn(),
  sendCallbacks: null as SendCallbacks | null, importCallbacks: null as ImportCallbacks | null,
  deleteCallbacks: null as { onSuccess: () => void; onError: (error: Error) => void } | null,
  sendPending: false,
}));
vi.mock("@/lib/trpc", () => ({ trpc: {
  useUtils: () => ({ discordTranscript: {
    list: { invalidate: mocks.invalidateList }, get: { invalidate: mocks.invalidateGet },
  } }),
  discordTranscript: {
    list: { useQuery: () => ({ data: mocks.docs.map(doc => ({
      id: doc.id, title: doc.title, filename: doc.filename, paragraphCount: doc.paragraphs.length,
      nextParagraph: doc.nextParagraph, createdAt: doc.createdAt, updatedAt: doc.updatedAt,
    })), error: mocks.listError, isPending: false, refetch: mocks.refetch }) },
    get: { useQuery: (input: { id: number }, options: { enabled: boolean; refetchInterval: number }) => {
      mocks.query(input, options);
      return { data: options.enabled ? mocks.docs.find(doc => doc.id === input.id) : undefined, error: mocks.getError, refetch: mocks.refetch };
    } },
    importText: { useMutation: () => ({ isPending: false, mutate: (input: unknown, callbacks: ImportCallbacks) => {
      mocks.importText(input); mocks.importCallbacks = callbacks;
    } }) },
    importFile: { useMutation: () => ({ isPending: false, mutate: (input: unknown, callbacks: ImportCallbacks) => {
      mocks.importFile(input); mocks.importCallbacks = callbacks;
    } }) },
    sendParagraph: { useMutation: () => ({ isPending: mocks.sendPending, mutate: (input: Payload, callbacks: SendCallbacks) => {
      mocks.send(input); mocks.sendCallbacks = callbacks;
    } }) },
    delete: { useMutation: () => ({ isPending: false, mutate: (input: unknown, callbacks: typeof mocks.deleteCallbacks) => {
      mocks.remove(input); mocks.deleteCallbacks = callbacks;
    } }) },
  },
} }));
import DiscordTranscriptControls, { type DiscordTranscriptControlsProps } from "../client/src/components/DiscordTranscriptControls";

const defaultDoc = (): Doc => ({
  id: 1, title: "Sunday sermon", filename: "sermon.txt",
  paragraphs: ["First paragraph. First closing sentence.", "Second paragraph.", "Third paragraph."],
  nextParagraph: 0, createdAt: 1, updatedAt: 1, lastRun: null,
});
const connected = { state: "connected", queueDepth: 0, currentText: null };
const sendButton = () => screen.getByRole("button", { name: "현재 문단 송출 / Send paragraph" }) as HTMLButtonElement;
const paragraph = () => screen.getByLabelText("현재 문단 / Current paragraph");
const paragraphSelect = () => screen.getByRole("combobox", { name: "문단 선택 / Choose paragraph" }) as HTMLSelectElement;
const fileInput = () => screen.getByLabelText(/^파일 \/ File/) as HTMLInputElement;
const mount = (runtime: DiscordTranscriptControlsProps["runtime"] = connected) => {
  const mounted = render(React.createElement(DiscordTranscriptControls, { runtime, onQueued: mocks.queued }));
  return { ...mounted, update: (next = runtime) => mounted.rerender(React.createElement(DiscordTranscriptControls, { runtime: next, onQueued: mocks.queued })) };
};
const selectDoc = async (id = 1) => userEvent.selectOptions(screen.getByRole("combobox", { name: "저장된 원고 / Saved transcript" }), String(id));
const setRun = (status: Run["status"], extra: Partial<Run> = {}, next = mocks.docs[0].nextParagraph) => {
  mocks.docs[0] = { ...mocks.docs[0], nextParagraph: next, updatedAt: mocks.docs[0].updatedAt + 1,
    lastRun: { id: "batch-1", paragraphIndex: 0, status, sentenceCount: 2, completedCount: 0, error: null, ...extra } };
};
beforeEach(() => {
  vi.stubGlobal("React", React);
  let uuid = 0;
  mocks.uuid.mockReset().mockImplementation(() => `00000000-0000-4000-8000-${String(++uuid).padStart(12, "0")}`);
  vi.stubGlobal("crypto", { randomUUID: mocks.uuid });
  mocks.docs = [defaultDoc()]; mocks.listError = null; mocks.getError = null; mocks.sendPending = false;
  mocks.sendCallbacks = null; mocks.importCallbacks = null; mocks.deleteCallbacks = null;
  [mocks.send, mocks.importText, mocks.importFile, mocks.remove, mocks.invalidateList, mocks.invalidateGet, mocks.refetch, mocks.query, mocks.queued].forEach(mock => mock.mockClear());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("staff transcript controls: explicit manual playback only", () => {
  it("does not auto-send on mount, document selection, polling updates, refresh/remount, or reconnection", async () => {
    const view = mount({ ...connected, state: "paused" });
    expect(mocks.query).toHaveBeenCalledWith({ id: 0 }, { enabled: false, refetchInterval: 2000 });
    await selectDoc();
    expect(paragraph().textContent).toContain("First paragraph");
    setRun("completed", { completedCount: 2 }, 1);
    view.update(connected);
    await waitFor(() => expect(paragraphSelect().value).toBe("1"));
    expect(mocks.query).toHaveBeenCalledWith({ id: 1 }, { enabled: true, refetchInterval: 2000 });
    expect(mocks.send).not.toHaveBeenCalled();
    view.unmount(); mount(); await selectDoc();
    expect(paragraphSelect().value).toBe("1");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("imports pasted text and warnings, selects saved next position, but never queues it", async () => {
    mount();
    fireEvent.change(screen.getByLabelText("제목 (선택) / Title (optional)"), { target: { value: " New sermon " } });
    fireEvent.change(screen.getByLabelText("또는 텍스트 붙여넣기 / Or paste text"), { target: { value: "First.\n\nSecond." } });
    await userEvent.click(screen.getByRole("button", { name: "텍스트 가져오기 / Import text" }));
    expect(mocks.importText).toHaveBeenCalledWith({ title: "New sermon", text: "First.\n\nSecond." });
    expect(screen.getByText(/Reading & importing/)).toBeTruthy();
    const imported = { ...defaultDoc(), id: 2, title: "New sermon", nextParagraph: 1, warnings: ["Review extracted text before sending."] };
    mocks.importCallbacks!.onSuccess(imported);
    await waitFor(() => expect(paragraphSelect().value).toBe("1"));
    expect(paragraph().textContent).toBe("Second paragraph.");
    expect(screen.getByText("Review extracted text before sending.")).toBeTruthy();
    expect(mocks.invalidateGet).toHaveBeenCalledWith({ id: 2 });
    expect(mocks.send).not.toHaveBeenCalled(); expect(mocks.queued).not.toHaveBeenCalled();
  });

  it("rejects files above 2 MiB BEFORE reading, and rejects unsupported extensions", () => {
    mount();
    const read = vi.spyOn(FileReader.prototype, "readAsDataURL");
    const huge = new File(["large"], "large.pdf", { type: "application/pdf" });
    Object.defineProperty(huge, "size", { value: 2 * 1024 * 1024 + 1 });
    fireEvent.change(fileInput(), { target: { files: [huge] } });
    expect(screen.getByRole("alert").textContent).toContain("2 MiB");
    expect(read).not.toHaveBeenCalled();
    fireEvent.change(fileInput(), { target: { files: [new File(["x"], "bad.exe")] } });
    expect(screen.getByRole("alert").textContent).toContain("Unsupported file type");
    expect(read).not.toHaveBeenCalled(); expect(mocks.importFile).not.toHaveBeenCalled();
    expect(fileInput().accept).toBe(".txt,.md,.docx,.pdf");
  });

  it("reads data URLs, strips the prefix, stays locked through server import, and never sends", async () => {
    mount();
    fireEvent.change(fileInput(), { target: { files: [new File(["A\n\nB"], "sermon.md", { type: "text/markdown" })] } });
    expect(fileInput().disabled).toBe(true);
    expect(screen.getByText(/Reading & importing/)).toBeTruthy();
    await waitFor(() => expect(mocks.importFile).toHaveBeenCalledWith({ title: "sermon", filename: "sermon.md", mimeType: "text/markdown", base64: "QQoKQg==" }));
    expect(fileInput().disabled).toBe(true);
    mocks.importCallbacks!.onSuccess({ ...defaultDoc(), warnings: [] });
    await waitFor(() => expect(fileInput().disabled).toBe(false));
    expect(paragraph().textContent).toContain("First paragraph");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("accepts exactly 2 MiB before reading and reports a FileReader error with an unlocked input", () => {
    mount();
    const read = vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (this: FileReader) {
      this.onerror?.(new ProgressEvent("error") as ProgressEvent<FileReader>);
    });
    const file = new File(["x"], "sermon.txt");
    Object.defineProperty(file, "size", { value: 2 * 1024 * 1024 });
    fireEvent.change(fileInput(), { target: { files: [file] } });
    expect(read).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert").textContent).toContain("Could not read file");
    expect(fileInput().disabled).toBe(false); expect(mocks.importFile).not.toHaveBeenCalled();
  });

  it("reports server import rejection without selecting or queuing a document", async () => {
    mount();
    fireEvent.change(fileInput(), { target: { files: [new File(["broken"], "bad.docx")] } });
    await waitFor(() => expect(mocks.importFile).toHaveBeenCalledTimes(1));
    mocks.importCallbacks!.onError(new Error("Invalid DOCX archive"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Invalid DOCX archive"));
    expect(fileInput().disabled).toBe(false); expect(mocks.send).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("현재 문단 / Current paragraph")).toBeNull();
  });

  it.each([undefined, { ...connected, state: "stopped" }, { ...connected, state: "reconnecting" }, { ...connected, state: "paused" }, { ...connected, queueDepth: 1 }, { ...connected, currentText: "Speaking" }])("locks sending for missing, disconnected, paused, or busy runtime: %j", async runtime => {
    // Explicit undefined must not use mount's default runtime.
    const view = render(React.createElement(DiscordTranscriptControls, { runtime, onQueued: mocks.queued }));
    await selectDoc();
    expect(sendButton().disabled).toBe(true);
    fireEvent.click(sendButton()); expect(mocks.send).not.toHaveBeenCalled(); view.unmount();
  });

  it.each(["queued", "playing"] as const)("locks sending and deletion for a document run %s", async status => {
    setRun(status); mount(); await selectDoc();
    expect(sendButton().disabled).toBe(true);
    expect((screen.getByRole("button", { name: "원고 삭제 / Delete transcript" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Sentences: 0 \/ 2/)).toBeTruthy();
  });

  it("locks send while the mutation is pending", async () => {
    const view = mount(); await selectDoc(); mocks.sendPending = true;
    view.rerender(React.createElement(DiscordTranscriptControls, { runtime: connected, onQueued: mocks.queued }));
    expect(sendButton().disabled).toBe(true); expect(mocks.send).not.toHaveBeenCalled();
  });

  it("navigates previous/next and paragraph select without sending, then sends exactly the chosen index", async () => {
    mount(); await selectDoc();
    expect((screen.getByRole("button", { name: "이전 / Prev" }) as HTMLButtonElement).disabled).toBe(true);
    const preview = screen.getByText("다음 문단 미리보기 / Next paragraph preview").parentElement as HTMLDetailsElement;
    expect(preview.open).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "다음 / Next" }));
    expect(paragraph().textContent).toBe("Second paragraph.");
    await userEvent.click(screen.getByRole("button", { name: "이전 / Prev" }));
    expect(paragraph().textContent).toContain("First paragraph");
    await userEvent.selectOptions(paragraphSelect(), "2");
    expect(paragraph().textContent).toBe("Third paragraph.");
    expect(screen.getByText("문단 3 / 3 · Paragraph")).toBeTruthy();
    expect(mocks.send).not.toHaveBeenCalled();
    await userEvent.click(sendButton());
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith({ id: 1, index: 2, requestId: "00000000-0000-4000-8000-000000000001", replay: false });
    expect(mocks.queued).not.toHaveBeenCalled();
  });

  it("blocks double clicks and locks locally after admission without claiming completion", async () => {
    const view = mount(); await selectDoc();
    fireEvent.click(sendButton()); fireEvent.click(sendButton());
    expect(mocks.send).toHaveBeenCalledTimes(1); expect(sendButton().disabled).toBe(true);
    mocks.sendCallbacks!.onSuccess({ batchId: "batch-1", paragraphIndex: 0, sentenceCount: 2 });
    view.update();
    await waitFor(() => expect(screen.getByText(/Queued; not completed/)).toBeTruthy());
    expect(mocks.queued).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Paragraph completed/)).toBeNull();
    expect(paragraphSelect().value).toBe("0"); expect(sendButton().disabled).toBe(true);
    fireEvent.click(sendButton()); expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.invalidateGet).toHaveBeenCalledWith({ id: 1 });
  });

  it("shows queued/playing sentence progress; only a completed run advances the saved highlight", async () => {
    const view = mount(); await selectDoc();
    await userEvent.click(sendButton());
    mocks.sendCallbacks!.onSuccess({ batchId: "batch-1", paragraphIndex: 0, sentenceCount: 2 });
    setRun("queued"); view.update();
    expect(paragraphSelect().value).toBe("0"); expect(screen.queryByText(/Paragraph completed/)).toBeNull();
    setRun("playing", { completedCount: 1 }); view.update();
    expect(screen.getByText(/Sentences: 1 \/ 2/)).toBeTruthy(); expect(paragraphSelect().value).toBe("0");
    setRun("completed", { completedCount: 2 }, 1); view.update();
    await waitFor(() => expect(paragraphSelect().value).toBe("1"));
    expect(screen.getByText(/Paragraph completed/)).toBeTruthy();
    expect(screen.getByText(/Sentences: 2 \/ 2/)).toBeTruthy();
    expect(sendButton().disabled).toBe(false); expect(mocks.send).toHaveBeenCalledTimes(1);
  });

  it("preserves an explicit operator selection when another paragraph finishes", async () => {
    setRun("playing"); const view = mount(); await selectDoc();
    await userEvent.selectOptions(paragraphSelect(), "2");
    setRun("completed", { completedCount: 2 }, 1); view.update();
    expect(paragraphSelect().value).toBe("2");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("keeps a stable request UUID and the original chosen index for an explicit timeout retry", async () => {
    const view = mount(); await selectDoc(); await userEvent.click(sendButton());
    const original = mocks.send.mock.calls[0][0];
    mocks.sendCallbacks!.onError(new Error("Timeout: response lost")); view.update();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Timeout: response lost"));
    await userEvent.selectOptions(paragraphSelect(), "2");
    await userEvent.click(screen.getByRole("button", { name: "같은 요청 재시도 / Retry same request" }));
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.send.mock.calls[1][0]).toEqual(original);
    expect(mocks.uuid).toHaveBeenCalledTimes(1); expect(mocks.queued).not.toHaveBeenCalled();
  });

  it("requires whole-paragraph confirmation for a previously successful paragraph and cancellation never sends", async () => {
    setRun("completed", { completedCount: 2 }, 1); mount(); await selectDoc();
    await userEvent.selectOptions(paragraphSelect(), "0");
    expect(paragraph().className).toContain("border-emerald-500");
    await userEvent.click(sendButton());
    expect(screen.getByRole("alertdialog").textContent).toContain("including any sentences already heard");
    expect(mocks.send).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "취소 / Cancel" }));
    expect(mocks.send).not.toHaveBeenCalled();
    await userEvent.click(sendButton());
    await userEvent.click(screen.getByRole("button", { name: "전체 재송출 확인 / Confirm replay" }));
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ id: 1, index: 0, replay: true }));
  });

  it.each(["failed", "cancelled", "interrupted"] as const)("highlights %s and offers only explicit whole-paragraph replay", async status => {
    setRun(status, { completedCount: 1, error: status === "failed" ? "Audio decode failed" : null });
    mount(); await selectDoc();
    expect(paragraph().className).toContain("border-red-400");
    expect(screen.getByText(/Not completed; replay repeats/)).toBeTruthy();
    expect(screen.getByText(/Sentences: 1 \/ 2/)).toBeTruthy();
    expect(mocks.send).not.toHaveBeenCalled();
    await userEvent.selectOptions(paragraphSelect(), "2");
    await userEvent.click(screen.getByRole("button", { name: "실패 문단 다시 송출 / Replay unfinished paragraph" }));
    expect(mocks.send).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "전체 재송출 확인 / Confirm replay" }));
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ index: 0, replay: true }));
  });

  it("requires a fresh replay confirmation and UUID when reusing Send after an errored request", async () => {
    const view = mount(); await selectDoc(); await userEvent.click(sendButton());
    mocks.sendCallbacks!.onError(new Error("Rejected")); view.update();
    await waitFor(() => expect(sendButton().disabled).toBe(false));
    await userEvent.click(sendButton()); expect(mocks.send).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "전체 재송출 확인 / Confirm replay" }));
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.send.mock.calls[1][0]).toEqual({ id: 1, index: 0, requestId: "00000000-0000-4000-8000-000000000002", replay: true });
  });

  it("shows end-of-transcript without auto-send and keeps earlier paragraphs navigable for confirmed replay", async () => {
    setRun("completed", { paragraphIndex: 2, completedCount: 2 }, 3); mount(); await selectDoc();
    expect(screen.getByText(/원고 끝 \/ End of transcript/)).toBeTruthy();
    expect(paragraphSelect().value).toBe("2");
    await userEvent.selectOptions(paragraphSelect(), "0");
    await userEvent.click(sendButton());
    expect(screen.getByRole("alertdialog")).toBeTruthy(); expect(mocks.send).not.toHaveBeenCalled();
  });

  it("discloses private parsed storage and confirms deletion; delete does not send", async () => {
    const view = mount(); await selectDoc();
    expect(screen.getByText(/Parsed text is private to staff; the raw file is not stored/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "원고 삭제 / Delete transcript" }));
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog").textContent).toContain("permanently");
    await userEvent.click(screen.getByRole("button", { name: "삭제 확인 / Confirm delete" }));
    expect(mocks.remove).toHaveBeenCalledWith({ id: 1 });
    mocks.docs = []; mocks.deleteCallbacks!.onSuccess(); view.update();
    await waitFor(() => expect(screen.queryByLabelText("현재 문단 / Current paragraph")).toBeNull());
    expect(mocks.invalidateList).toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rechecks active-run locks if runtime changes while a replay confirmation is open", async () => {
    setRun("failed"); const view = mount(); await selectDoc(); await userEvent.click(sendButton());
    view.update({ ...connected, queueDepth: 1 });
    const confirm = screen.getByRole("button", { name: "전체 재송출 확인 / Confirm replay" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true); fireEvent.click(confirm); expect(mocks.send).not.toHaveBeenCalled();
  });
});
