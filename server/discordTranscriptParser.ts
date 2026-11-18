import { createRequire } from "node:module";
import { extname } from "node:path";
import { Worker } from "node:worker_threads";

export const TRANSCRIPT_MAX_BYTES = 2 * 1024 * 1024;
export const TRANSCRIPT_MAX_CHARS = 150_000;
export const TRANSCRIPT_MAX_PARAGRAPHS = 500;

const MAX_PARAGRAPH_CHARS = 12_000;
const WORKER_TIMEOUT_MS = 10_000;
const ZIP_MAX_EXPANDED_BYTES = 16 * 1024 * 1024;
const ZIP_MAX_ENTRY_BYTES = 8 * 1024 * 1024;
const ZIP_MAX_ENTRIES = 512;
const requireFromHere = createRequire(import.meta.url);
const READABLE_TEXT = new RegExp("[\\p{L}\\p{N}]", "u");

type TranscriptFormat = "txt" | "md" | "docx" | "pdf";
type UploadResult = { paragraphs: string[]; warnings: string[] };

const MIME_TYPES: Record<TranscriptFormat, readonly string[]> = {
  txt: ["text/plain"],
  md: ["text/markdown", "text/x-markdown", "text/plain"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  pdf: ["application/pdf"],
};

function checkText(text: string) {
  if (typeof text !== "string") throw new Error("Transcript text must be a string.");
  if (text.length > TRANSCRIPT_MAX_CHARS) {
    throw new Error(`Transcript exceeds ${TRANSCRIPT_MAX_CHARS.toLocaleString("en-US")} characters. Split it into smaller transcripts.`);
  }
  // Permit only tabs and line endings among control characters. Never silently
  // remove binary bytes or change the transcript's semantic text.
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(text)) {
    throw new Error("Transcript contains control characters or binary data. Upload a readable text document.");
  }
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text)) {
    throw new Error("Transcript contains malformed Unicode text. Save it as UTF-8 and try again.");
  }
}

function stripStructuralMarkdown(lines: string[]): string[] {
  // Inline emphasis, links, quotes, scripture references, and punctuation are
  // deliberately left alone. A single leading dash/number may be semantic text;
  // only a run of at least two similarly marked list items is treated as a list.
  const listMarker = /^(?:[-+*]|\d{1,3}[.)])[ \t]+(?=\S)/;
  const listKind = (line: string) => /^(?:[-+*])[ \t]+\S/.test(line) ? "bullet"
    : /^\d{1,3}[.)][ \t]+\S/.test(line) ? "ordered" : null;
  const result: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    let line = lines[index];
    const heading = /^(#{1,6})[ \t]+(.+)$/.exec(line);
    if (heading) line = heading[2].replace(/[ \t]+#+[ \t]*$/, "");
    const kind = listKind(line);
    if (kind && (listKind(lines[index - 1] ?? "") === kind || listKind(lines[index + 1] ?? "") === kind)) {
      line = line.replace(listMarker, "");
    }
    if (/^(?:={3,}|-{3,})[ \t]*$/.test(lines[index + 1] ?? "") && READABLE_TEXT.test(line) && line.length <= 200) {
      index += 1; // A short setext heading and its underline, not inline dashes.
    }
    result.push(line);
  }
  return result;
}

function textToParagraphs(text: string, markdown: boolean): string[] {
  checkText(text);
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const paragraphs: string[] = [];
  for (const block of normalized.split(/\n[ \t]*\n+/)) {
    const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
    const paragraph = (markdown ? stripStructuralMarkdown(lines) : lines)
      .join(" ").replace(/[ \t]+/g, " ").trim();
    if (!paragraph) continue;
    if (paragraph.length > MAX_PARAGRAPH_CHARS) {
      throw new Error(`Paragraph ${paragraphs.length + 1} exceeds ${MAX_PARAGRAPH_CHARS.toLocaleString("en-US")} characters. Split it with blank lines before trying again.`);
    }
    paragraphs.push(paragraph);
    if (paragraphs.length > TRANSCRIPT_MAX_PARAGRAPHS) {
      throw new Error(`Transcript exceeds ${TRANSCRIPT_MAX_PARAGRAPHS} paragraphs. Split it into smaller transcripts.`);
    }
  }
  if (!paragraphs.some(paragraph => READABLE_TEXT.test(paragraph))) {
    throw new Error("Transcript has no readable text. Paste text or upload a document containing selectable text.");
  }
  return paragraphs;
}

/** Normalize pasted English sermon text without translating or rewriting it. */
export function parseTranscriptText(text: string): string[] {
  return textToParagraphs(text, true);
}

function decodeBase64(base64: string): Buffer {
  if (typeof base64 !== "string" || !base64.length) throw new Error("Transcript upload is empty.");
  // Bound the encoded input before regex matching or allocating a decoded copy.
  if (base64.length > Math.ceil(TRANSCRIPT_MAX_BYTES / 3) * 4) {
    throw new Error("Transcript file exceeds the 2 MiB upload limit. Split it into smaller files.");
  }
  if (base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    throw new Error("Transcript upload must contain strict, canonical base64 (without a data URL or whitespace).");
  }
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  if (base64.length / 4 * 3 - padding > TRANSCRIPT_MAX_BYTES) {
    throw new Error("Transcript file exceeds the 2 MiB upload limit. Split it into smaller files.");
  }
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length || buffer.toString("base64") !== base64) {
    throw new Error("Transcript upload must contain strict, canonical base64.");
  }
  return buffer;
}

function selectFormat(filename: string, mimeType?: string): TranscriptFormat {
  if (typeof filename !== "string" || !filename.trim() || filename.length > 255 || /[\u0000-\u001f]/.test(filename)) {
    throw new Error("A valid transcript filename is required.");
  }
  const extension = extname(filename).toLowerCase().slice(1);
  if (!Object.prototype.hasOwnProperty.call(MIME_TYPES, extension)) {
    throw new Error("Unsupported transcript file. Upload a .txt, .md, .docx, or text-based .pdf file.");
  }
  const format = extension as TranscriptFormat;
  if (mimeType !== undefined && typeof mimeType !== "string") throw new Error("Invalid transcript MIME type.");
  const mime = mimeType?.split(";", 1)[0].trim().toLowerCase();
  // Browsers sometimes supply no MIME or the generic binary MIME for a local
  // file. These are permitted only with a known extension and valid contents.
  if (mime && mime !== "application/octet-stream" && !MIME_TYPES[format].includes(mime)) {
    throw new Error("Transcript MIME type does not match its filename. Upload a .txt, .md, .docx, or .pdf with the correct file type.");
  }
  return format;
}

function validateDocxArchive(buffer: Buffer) {
  const invalid = () => new Error("Invalid DOCX ZIP archive. Re-save the document as .docx and try again.");
  let end = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 22 - 65_535); offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50 && offset + 22 + buffer.readUInt16LE(offset + 20) === buffer.length) {
      end = offset;
      break;
    }
  }
  if (end < 0) throw invalid();
  const count = buffer.readUInt16LE(end + 10);
  const directorySize = buffer.readUInt32LE(end + 12);
  const directoryOffset = buffer.readUInt32LE(end + 16);
  if (buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6) || buffer.readUInt16LE(end + 8) !== count ||
      count === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) {
    throw new Error("Multi-disk and ZIP64 DOCX archives are not supported. Re-save a smaller document.");
  }
  if (!count || count > ZIP_MAX_ENTRIES) throw new Error("DOCX archive contains too many entries. Re-save a simpler document.");
  if (directoryOffset + directorySize !== end) throw invalid();
  let offset = directoryOffset;
  let expandedTotal = 0;
  const names = new Set<string>();
  const ranges: Array<[number, number]> = [];
  for (let entry = 0; entry < count; entry += 1) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50) throw invalid();
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressed = buffer.readUInt32LE(offset + 20);
    const expanded = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const next = offset + 46 + nameLength + extraLength + commentLength;
    if (next > end || !nameLength || buffer.readUInt16LE(offset + 34)) throw invalid();
    if (flags & 0x41) throw new Error("Encrypted DOCX archives are not supported. Remove password protection and upload again.");
    if (method !== 0 && method !== 8) throw new Error("Unsupported DOCX ZIP compression. Re-save the document as .docx.");
    if (compressed === 0xffffffff || expanded === 0xffffffff || localOffset === 0xffffffff) throw invalid();
    expandedTotal += expanded;
    if (expanded > ZIP_MAX_ENTRY_BYTES || expandedTotal > ZIP_MAX_EXPANDED_BYTES ||
        (expanded > 1024 * 1024 && expanded / Math.max(1, compressed) > 200)) {
      throw new Error("DOCX archive expands beyond safe size limits (possible ZIP decompression bomb). Split or re-save a smaller document.");
    }
    if ((method === 0 && compressed !== expanded) || (expanded > 0 && compressed === 0)) throw invalid();
    const nameBytes = buffer.subarray(offset + 46, offset + 46 + nameLength);
    const name = nameBytes.toString("latin1");
    if (names.has(name) || name.includes("\0") || name.includes("\\") || name.startsWith("/") || name.split("/").includes("..")) throw invalid();
    names.add(name);
    const extraEnd = offset + 46 + nameLength + extraLength;
    for (let extra = offset + 46 + nameLength; extra < extraEnd;) {
      if (extra + 4 > extraEnd) throw invalid();
      const id = buffer.readUInt16LE(extra);
      const size = buffer.readUInt16LE(extra + 2);
      if (id === 1 || id === 0x9901) throw new Error("ZIP64 or encrypted DOCX archives are not supported.");
      extra += 4 + size;
      if (extra > extraEnd) throw invalid();
    }
    if (localOffset + 30 > directoryOffset || buffer.readUInt32LE(localOffset) !== 0x04034b50) throw invalid();
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const dataStart = localOffset + 30 + localNameLength + buffer.readUInt16LE(localOffset + 28);
    if (dataStart + compressed > directoryOffset || buffer.readUInt16LE(localOffset + 6) !== flags ||
        buffer.readUInt16LE(localOffset + 8) !== method ||
        !buffer.subarray(localOffset + 30, localOffset + 30 + localNameLength).equals(nameBytes)) throw invalid();
    if (!(flags & 8) && (buffer.readUInt32LE(localOffset + 18) !== compressed || buffer.readUInt32LE(localOffset + 22) !== expanded)) throw invalid();
    ranges.push([localOffset, dataStart + compressed]);
    offset = next;
  }
  if (offset !== end || !names.has("[Content_Types].xml") || !names.has("word/document.xml")) {
    throw new Error("ZIP file is not a DOCX document. Upload a genuine .docx transcript.");
  }
  ranges.sort((a, b) => a[0] - b[0]);
  if (ranges.some((range, index) => index > 0 && range[0] < ranges[index - 1][1])) throw invalid();
}

function validateMagic(buffer: Buffer, format: TranscriptFormat) {
  const zip = buffer.length >= 4 && buffer.readUInt32LE(0) === 0x04034b50;
  const pdf = buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (format === "docx") {
    if (!zip) throw new Error("File contents do not match DOCX ZIP magic. Upload a genuine .docx document.");
    validateDocxArchive(buffer);
  } else if (format === "pdf") {
    if (!pdf) throw new Error("File contents do not match PDF magic. Upload a genuine .pdf document.");
  } else if (zip || pdf || (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex")))) {
    throw new Error("File contents are binary or do not match the text filename. Upload the original .docx or .pdf, or save as UTF-8 text.");
  }
}

// A literal, self-contained CommonJS program survives TS/ESM bundling. Do NOT
// serialize TS functions or import mammoth/pdf-parse on the Discord event loop.
const EXTRACTION_WORKER = String.raw`
const { parentPort, workerData } = require("node:worker_threads");
const { TextDecoder } = require("node:util");
const buffer = Buffer.from(workerData.bytes);
const maxChars = workerData.maxChars;
const tooLong = "Transcript exceeds 150,000 characters. Split it into smaller transcripts.";
function bounded(text) {
  if (typeof text !== "string") throw new Error("Parser returned invalid transcript text.");
  if (text.length > maxChars) throw new Error(tooLong);
  return text;
}
async function extract() {
  if (workerData.format === "txt" || workerData.format === "md") {
    let encoding = "utf-8";
    let start = 0;
    if (buffer[0] === 0xff && buffer[1] === 0xfe) { encoding = "utf-16le"; start = 2; }
    else if (buffer[0] === 0xfe && buffer[1] === 0xff) { encoding = "utf-16be"; start = 2; }
    try {
      return { text: bounded(new TextDecoder(encoding, { fatal: true }).decode(buffer.subarray(start))), warnings: [] };
    } catch (error) {
      if (error.message === tooLong) throw error;
      throw new Error("Transcript has malformed UTF-8/UTF-16 text or binary data. Save it as UTF-8 (or UTF-16 with a BOM) and try again.");
    }
  }
  const parser = require(workerData.modulePath);
  if (workerData.format === "docx") {
    // extractRawText drops break nodes entirely, concatenating adjacent words.
    // Read the semantic tree through Mammoth's public transform hook instead;
    // return an empty tree so no HTML or image conversion is performed.
    const chunks = [];
    let extractedChars = 0;
    function append(text) {
      extractedChars += text.length;
      if (extractedChars > maxChars) throw new Error(tooLong);
      chunks.push(text);
    }
    function readText(element) {
      if (element.type === "text") append(element.value);
      else if (element.type === "tab") append("\t");
      else if (element.type === "break") append("\n");
      else {
        for (const child of element.children || []) readText(child);
        if (element.type === "paragraph") append("\n\n");
      }
    }
    const result = await parser.convertToHtml({ buffer }, {
      includeDefaultStyleMap: false,
      includeEmbeddedStyleMap: false,
      transformDocument(document) {
        readText(document);
        return { ...document, children: [] };
      },
    });
    const warnings = [...new Set((result.messages || []).filter(message => message.type === "warning")
      .map(message => String(message.message).slice(0, 300)))].slice(0, 10);
    return { text: bounded(chunks.join("")), warnings };
  }
  let renderedChars = 0;
  let renderingError = null;
  const pagerender = async page => {
    if (renderingError) return "";
    try {
      const content = await page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
      let text = "", lastY = null, lastRight = null, lastHeight = 0;
      for (const item of content.items) {
        if (!item.str) continue;
        const y = item.transform[5];
        const x = item.transform[4];
        const height = Math.max(1, Math.abs(item.height || item.transform[3] || 12));
        let separator = "";
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          separator = Math.abs(y - lastY) > Math.max(height, lastHeight) * 1.6 ? "\n\n" : "\n";
        } else if (lastRight !== null && x - lastRight > Math.max(1, height * 0.15) && !/\s$/.test(text) && !/^\s/.test(item.str)) {
          separator = " ";
        }
        renderedChars += separator.length + item.str.length;
        if (renderedChars > maxChars) throw new Error(tooLong);
        text += separator + item.str;
        lastY = y; lastRight = x + (item.width || 0); lastHeight = height;
      }
      renderedChars += 2; // pdf-parse inserts a paragraph break per page.
      if (renderedChars > maxChars) throw new Error(tooLong);
      return text;
    } catch (error) {
      // pdf-parse 1.1.1 swallows pagerender rejections. Record them explicitly,
      // so incomplete/oversized extraction is never accepted as a transcript.
      renderingError = error;
      return "";
    }
  };
  // Select the supported bundled engine explicitly. Legacy PDFJS assumes
  // Uint8Array.slice copies bytes; Buffer.slice returns a shared view instead,
  // corrupting its cross-reference reads even for valid PDFs.
  const result = await parser(new Uint8Array(buffer), { pagerender, max: 501, version: "v2.0.550" });
  if (renderingError) throw renderingError;
  if (result.numpages > 500) throw new Error("PDF exceeds 500 pages. Split it into smaller documents.");
  const text = bounded(result.text);
  if (!new RegExp("[\\p{L}\\p{N}]", "u").test(text)) {
    throw new Error("PDF has no readable selectable text and may be scanned/image-only. Run OCR first or paste the sermon text; scanned PDFs are not supported.");
  }
  return { text, warnings: ["PDF paragraph and line-break inference is best effort. Review the extracted paragraphs and line breaks before broadcasting."] };
}
extract().then(result => parentPort.postMessage(result)).catch(error => {
  parentPort.postMessage({ error: error && error.message ? String(error.message).slice(0, 500) : "Unable to read transcript document." });
});
`;

async function extractInWorker(bytes: Buffer, format: TranscriptFormat): Promise<{ text: string; warnings: string[] }> {
  let modulePath: string | undefined;
  if (format === "docx" || format === "pdf") {
    try {
      // The pdf-parse package index performs a debug-file read when required by
      // an eval worker (module.parent is absent). Use its real library entry.
      modulePath = requireFromHere.resolve(format === "docx" ? "mammoth" : "pdf-parse/lib/pdf-parse.js");
    } catch {
      throw new Error(`Transcript ${format.toUpperCase()} parser is unavailable on the server. Contact the operator or upload a .txt file.`);
    }
  }
  const worker = new Worker(EXTRACTION_WORKER, {
    eval: true,
    execArgv: [], // Never inherit tsx/Vitest/bundler loaders into the worker.
    resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 32, stackSizeMb: 4 },
    workerData: { bytes, format, modulePath, maxChars: TRANSCRIPT_MAX_CHARS },
    stdout: true,
    stderr: true,
  });
  worker.stdout?.resume();
  worker.stderr?.resume();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await new Promise<{ text: string; warnings: string[] }>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error("Transcript parsing timed out after 10 seconds. Split or re-save a smaller document.")), WORKER_TIMEOUT_MS);
      worker.once("message", (message: unknown) => {
        if (!message || typeof message !== "object") return reject(new Error("Transcript parser returned an invalid response."));
        const result = message as { error?: unknown; text?: unknown; warnings?: unknown };
        if (typeof result.error === "string") return reject(new Error(result.error));
        if (typeof result.text !== "string" || result.text.length > TRANSCRIPT_MAX_CHARS ||
            !Array.isArray(result.warnings) || result.warnings.length > 10 ||
            !result.warnings.every(warning => typeof warning === "string" && warning.length <= 500)) {
          return reject(new Error("Transcript parser returned an invalid response."));
        }
        resolve({ text: result.text, warnings: result.warnings as string[] });
      });
      worker.once("error", () => reject(new Error("Transcript parser failed or exceeded its memory limit. Split or re-save a smaller document.")));
      worker.once("exit", () => reject(new Error("Transcript parser exited before completing the document. Try a smaller file.")));
    });
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    // Keep the error listener until termination completes, including on timeout.
    // Await termination on success too: no parser workers outlive the request.
    try { await worker.terminate(); } catch { /* Already stopped. */ }
    worker.removeAllListeners();
  }
}

/** Validate an upload before performing any document parsing in a bounded worker. */
export async function parseTranscriptUpload(input: { filename: string; mimeType?: string; base64: string }): Promise<UploadResult> {
  if (!input || typeof input !== "object") throw new Error("A transcript upload is required.");
  const format = selectFormat(input.filename, input.mimeType);
  const bytes = decodeBase64(input.base64);
  validateMagic(bytes, format);
  const { text, warnings } = await extractInWorker(bytes, format);
  return { paragraphs: textToParagraphs(text, format === "txt" || format === "md"), warnings };
}
