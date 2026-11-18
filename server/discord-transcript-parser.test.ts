import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { deflateRawSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseTranscriptText,
  parseTranscriptUpload,
  TRANSCRIPT_MAX_BYTES,
  TRANSCRIPT_MAX_CHARS,
  TRANSCRIPT_MAX_PARAGRAPHS,
} from "./discordTranscriptParser";

const requireFromHere = createRequire(import.meta.url);
const upload = (filename: string, bytes: Buffer | string, mimeType?: string) => parseTranscriptUpload({
  filename,
  mimeType,
  base64: Buffer.from(bytes).toString("base64"),
});

// Real, small in-memory fixtures. No network, fixture downloads, or files added.
function crc32(bytes: Buffer) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function zip(entries: Array<[string, string]>, compression = true): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [filename, text] of entries) {
    const name = Buffer.from(filename);
    const raw = Buffer.from(text);
    const data = compression ? deflateRawSync(raw) : raw;
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(compression ? 8 : 0, 8);
    header.writeUInt32LE(crc32(raw), 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(raw.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, data);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(compression ? 8 : 0, 10);
    directory.writeUInt32LE(crc32(raw), 16);
    directory.writeUInt32LE(data.length, 20);
    directory.writeUInt32LE(raw.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(offset, 42);
    central.push(directory, name);
    offset += header.length + name.length + data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

function docx(documentXml?: string, compression = true) {
  return zip([
    ["[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ["_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ["word/document.xml", documentXml ?? '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Grace &amp; peace—today.</w:t><w:br/><w:t>A wrapped line.</w:t></w:r></w:p><w:p><w:r><w:t># A literal heading with **emphasis**.</w:t></w:r></w:p></w:body></w:document>'],
  ], compression);
}

function pdf(empty = false): Buffer {
  const content = empty ? "" : "BT /F1 12 Tf 72 720 Td (Grace and peace.) Tj 0 -14 Td (A wrapped line.) Tj 0 -30 Td (A second paragraph.) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let source = "%PDF-1.4\n%fixture\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(source));
    source += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(source);
  source += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  source += offsets.slice(1).map(offset => `${offset.toString().padStart(10, "0")} 00000 n \n`).join("");
  source += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(source);
}

function centralOffset(buffer: Buffer) {
  return buffer.readUInt32LE(buffer.length - 22 + 16);
}

const hasDependency = (name: string) => {
  try { requireFromHere.resolve(name); return true; } catch { return false; }
};

describe("pasted transcript paragraphs", () => {
  it("exports the upload, character, and paragraph limits", () => {
    expect(TRANSCRIPT_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect(TRANSCRIPT_MAX_CHARS).toBe(150000);
    expect(TRANSCRIPT_MAX_PARAGRAPHS).toBe(500);
  });

  it("normalizes BOM, CRLF, blank lines, indentation, and wrapped lines without changing Unicode/punctuation", () => {
    expect(parseTranscriptText("\uFEFF  Grace—‘peace’, café.\r\n wrapped\tline.\r\n \t\r\n\r\nSecond: 사랑; John 3:16.\rLast line.  "))
      .toEqual(["Grace—‘peace’, café. wrapped line.", "Second: 사랑; John 3:16. Last line."]);
  });

  it("strips conservative structural heading/list markup but keeps inline semantics", () => {
    expect(parseTranscriptText("# Sermon title ###\n\n## Grace\nWrapped **words**, [John](https://example.test).\n\n- First point\n- Second point\n\n1. Faith\n2. Hope\n\nSetext title\n===\n\n> A quotation.\n#hashtag -5 +3 *literal*"))
      .toEqual(["Sermon title", "Grace Wrapped **words**, [John](https://example.test).", "First point Second point", "Faith Hope", "Setext title", "> A quotation. #hashtag -5 +3 *literal*"]);
  });

  it("does not erase a standalone semantic number or dash", () => {
    expect(parseTranscriptText("1. John wrote this.\n\n- A dash stands alone.\n\n---"))
      .toEqual(["1. John wrote this.", "- A dash stands alone.", "---"]);
  });

  it.each(["", " \n\t\r\n ", "###\n\n---", "\u200b\u200d"])("rejects input without readable text: %j", text => {
    expect(() => parseTranscriptText(text)).toThrow(/no readable text/i);
  });

  it.each(["Sermon\0binary", "text\u0007", "text\u007f", "text\u0085", "text\u000c"])("rejects control characters: %j", text => {
    expect(() => parseTranscriptText(text)).toThrow(/control characters|binary/i);
  });

  it("rejects malformed Unicode rather than rewriting it", () => {
    expect(() => parseTranscriptText("Broken \ud800 value")).toThrow(/malformed Unicode/i);
    expect(parseTranscriptText("Peace 🕊️ and grace.")).toEqual(["Peace 🕊️ and grace."]);
  });

  it("enforces the total characters, paragraph count, and individual paragraph limits", () => {
    expect(() => parseTranscriptText("x".repeat(TRANSCRIPT_MAX_CHARS + 1))).toThrow(/150,000/);
    expect(() => parseTranscriptText("x".repeat(12001))).toThrow(/Paragraph 1.*12,000.*blank lines/);
    expect(parseTranscriptText("x".repeat(12000))[0]).toHaveLength(12000);
    expect(parseTranscriptText(Array(500).fill("Grace.").join("\n\n"))).toHaveLength(500);
    expect(() => parseTranscriptText(Array(501).fill("Grace.").join("\n\n"))).toThrow(/500 paragraphs/);
    const blocks = [...Array(12).fill("x".repeat(12000)), "x".repeat(6000 - 24)];
    expect(parseTranscriptText(blocks.join("\n\n"))).toHaveLength(13);
  });
});

describe("transcript uploads and file validation", () => {
  it("reads UTF-8 TXT and Markdown through real workers", async () => {
    expect(await upload("sermon.TXT", "\uFEFFGrace—peace.\r\nWrap.\r\n\r\nAmen.", "text/plain; charset=utf-8"))
      .toEqual({ paragraphs: ["Grace—peace. Wrap.", "Amen."], warnings: [] });
    expect(await upload("sermon.md", "# Grace\n\n- Faith\n- Hope", "text/markdown"))
      .toEqual({ paragraphs: ["Grace", "Faith Hope"], warnings: [] });
  });

  it("allows omitted/empty/generic browser MIME only with a known extension and valid contents", async () => {
    for (const mime of [undefined, "", "application/octet-stream"]) {
      expect((await upload("sermon.txt", "Grace.", mime)).paragraphs).toEqual(["Grace."]);
    }
  });

  it("supports UTF-16 LE and BE BOM files and rejects malformed encodings", async () => {
    const le = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("Grace—peace.\n\nAmen.", "utf16le")]);
    const be = Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from("Grace—peace.\n\nAmen.", "utf16le").swap16()]);
    for (const bytes of [le, be]) expect((await upload("sermon.txt", bytes)).paragraphs).toEqual(["Grace—peace.", "Amen."]);
    await expect(upload("sermon.txt", Buffer.from([0x47, 0xc3, 0x28]))).rejects.toThrow(/malformed UTF-8/);
    await expect(upload("sermon.txt", Buffer.from([0xff, 0xfe, 0x47]))).rejects.toThrow(/malformed UTF-8\/UTF-16/);
    await expect(upload("sermon.txt", Buffer.from([0x47, 0x00, 0x72, 0x00]))).rejects.toThrow(/control characters|binary/);
  });

  it.each([
    ["sermon.txt", "application/pdf"],
    ["sermon.docx", "application/zip"],
    ["sermon.pdf", "text/plain"],
    ["sermon.md", "text/html"],
  ])("rejects mismatched/disallowed MIME: %s %s", async (filename, mime) => {
    await expect(upload(filename, "Grace.", mime)).rejects.toThrow(/MIME type/);
  });

  it.each(["sermon.exe", "sermon.doc", "sermon.rtf", "sermon.pdf.exe", "sermon", ""])("rejects unsupported filename: %s", async filename => {
    await expect(upload(filename, "Grace.")).rejects.toThrow(/filename|required|Unsupported/);
  });

  it("checks DOCX/PDF magic and rejects disguised binary text uploads", async () => {
    await expect(upload("sermon.docx", "Grace.")).rejects.toThrow(/DOCX ZIP magic/);
    await expect(upload("sermon.pdf", "Grace.")).rejects.toThrow(/PDF magic/);
    await expect(upload("sermon.txt", docx())).rejects.toThrow(/binary|do not match/);
    await expect(upload("sermon.md", pdf())).rejects.toThrow(/binary|do not match/);
    await expect(upload("sermon.txt", Buffer.from("d0cf11e0a1b11ae10000", "hex"))).rejects.toThrow(/binary/);
  });

  it.each(["", " ", "Rw", "Rw=", "Rw===", "Rw==\n", "_w==", "data:text/plain;base64,Rw==", "Rh==", "R3J="])("rejects empty/invalid/noncanonical base64: %j", async base64 => {
    await expect(parseTranscriptUpload({ filename: "sermon.txt", base64 })).rejects.toThrow(/empty|base64/);
  });

  it("rejects oversized encoded input before decoding, including the padded boundary case", async () => {
    await expect(parseTranscriptUpload({ filename: "sermon.txt", base64: "A".repeat(Math.ceil(TRANSCRIPT_MAX_BYTES / 3) * 4 + 4) })).rejects.toThrow(/2 MiB/);
    await expect(upload("sermon.txt", Buffer.alloc(TRANSCRIPT_MAX_BYTES + 1, 65))).rejects.toThrow(/2 MiB/);
  });

  it("rejects empty/binary/unreadable uploads and extracted paragraph/character overflow", async () => {
    await expect(upload("sermon.txt", "\n\t ")).rejects.toThrow(/no readable text/);
    await expect(upload("sermon.txt", "Sermon\0binary")).rejects.toThrow(/control characters/);
    await expect(upload("sermon.txt", "x".repeat(12001))).rejects.toThrow(/12,000.*blank lines/);
    await expect(upload("sermon.txt", "x".repeat(TRANSCRIPT_MAX_CHARS + 1))).rejects.toThrow(/150,000/);
  });

  it("rejects ZIP files without DOCX parts and malformed central directories", async () => {
    await expect(upload("sermon.docx", zip([["readme.txt", "Grace."]]))).rejects.toThrow(/not a DOCX/);
    await expect(upload("sermon.docx", docx().subarray(0, -8))).rejects.toThrow(/Invalid DOCX ZIP/);
    const invalid = docx();
    invalid.writeUInt32LE(0xffffffff, invalid.length - 22 + 16);
    await expect(upload("sermon.docx", invalid)).rejects.toThrow(/ZIP64/);
  });

  it("rejects encrypted archives and oversized expanded metadata before loading Mammoth", async () => {
    const encrypted = docx();
    encrypted.writeUInt16LE(1, centralOffset(encrypted) + 8);
    await expect(upload("sermon.docx", encrypted)).rejects.toThrow(/Encrypted DOCX/);
    const bomb = docx();
    bomb.writeUInt32LE(9 * 1024 * 1024, centralOffset(bomb) + 24);
    await expect(upload("sermon.docx", bomb)).rejects.toThrow(/expands beyond safe size.*bomb/);
    const ratioBomb = docx();
    ratioBomb.writeUInt32LE(2 * 1024 * 1024, centralOffset(ratioBomb) + 24);
    await expect(upload("sermon.docx", ratioBomb)).rejects.toThrow(/safe size/);
  });

  it("rejects contradictory local headers and duplicate DOCX parts", async () => {
    const contradictory = docx();
    contradictory.writeUInt32LE(999, 22);
    await expect(upload("sermon.docx", contradictory)).rejects.toThrow(/Invalid DOCX ZIP/);
    await expect(upload("sermon.docx", zip([["word/document.xml", "a"], ["word/document.xml", "b"], ["[Content_Types].xml", "c"]]))).rejects.toThrow(/Invalid DOCX ZIP/);
  });

  it.each([false, true])("generates a valid PDF cross-reference table (empty: %s)", empty => {
    const bytes = pdf(empty);
    const source = bytes.toString("ascii");
    const startxref = /startxref\n(\d+)\n%%EOF/.exec(source);
    expect(startxref).not.toBeNull();
    const offset = Number(startxref![1]);
    const table = bytes.subarray(offset).toString("ascii");
    expect(table).toMatch(/^xref\n0 6\n0000000000 65535 f \n/);
    const entries = table.match(/\d{10} 00000 n \n/g) ?? [];
    expect(entries).toHaveLength(5);
    entries.forEach((entry, index) => {
      expect(bytes.subarray(Number(entry.slice(0, 10))).toString("ascii"))
        .toMatch(new RegExp(`^${index + 1} 0 obj\\n`));
    });
    const stream = /<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/.exec(source);
    expect(stream).not.toBeNull();
    expect(Buffer.byteLength(stream![2])).toBe(Number(stream![1]));
  });

  it.skipIf(!hasDependency("mammoth"))("extracts a real compressed and stored DOCX preserving paragraph boundaries and semantic markup", async () => {
    for (const compressed of [true, false]) {
      const result = await upload("sermon.docx", docx(undefined, compressed), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      expect(result.paragraphs).toEqual(["Grace & peace—today. A wrapped line.", "# A literal heading with **emphasis**."]);
      expect(result.warnings).toEqual([]);
    }
    const empty = '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/></w:body></w:document>';
    await expect(upload("empty.docx", docx(empty))).rejects.toThrow(/no readable text/);
  });

  it("preserves DOCX run adjacency, line/page breaks, tabs, and literal text without HTML conversion", async () => {
    const xml = '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Grace</w:t></w:r><w:r><w:t>ful</w:t><w:br/><w:t>faith.</w:t><w:tab/><w:t>&lt;Amen&gt; &amp; peace.</w:t><w:br w:type="page"/><w:t>Next page.</w:t></w:r></w:p><w:p><w:r><w:t>**Literal** text.</w:t></w:r></w:p></w:body></w:document>';
    expect(await upload("breaks.docx", docx(xml))).toEqual({
      paragraphs: ["Graceful faith. <Amen> & peace. Next page.", "**Literal** text."],
      warnings: [],
    });
  });

  it("rejects real DOCX extracted character and paragraph overflow", async () => {
    const xml = (text: string) => `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`;
    await expect(upload("large.docx", docx(xml("x".repeat(TRANSCRIPT_MAX_CHARS + 1))))).rejects.toThrow(/150,000/);
    await expect(upload("paragraph.docx", docx(xml("x".repeat(12001))))).rejects.toThrow(/12,000.*blank lines/);
  });

  it.skipIf(!hasDependency("pdf-parse"))("extracts a real PDF with best-effort paragraph breaks and a review warning", async () => {
    const result = await upload("sermon.pdf", pdf(), "application/pdf");
    expect(result.paragraphs).toEqual(["Grace and peace. A wrapped line.", "A second paragraph."]);
    expect(result.warnings.join(" ")).toMatch(/best effort.*Review.*line breaks/);
  });

  it.skipIf(!hasDependency("pdf-parse"))("rejects empty/scanned PDFs with selectable-text and OCR guidance", async () => {
    await expect(upload("scanned.pdf", pdf(true))).rejects.toThrow(/selectable text.*scanned.*OCR/);
    await expect(upload("broken.pdf", "%PDF-1.4\nnot a PDF")).rejects.toThrow();
  });

  it("uses a literal worker source and resolves dependencies without importing parsers on the event loop", () => {
    const source = readFileSync(resolve(process.cwd(), "server/discordTranscriptParser.ts"), "utf8");
    expect(source).toContain("createRequire(import.meta.url)");
    expect(source).toContain("pdf-parse/lib/pdf-parse.js");
    expect(source).toContain("String.raw`");
    expect(source).not.toMatch(/import\s+.*from\s+["'](?:mammoth|pdf-parse)/);
    expect(source).not.toContain(".toString()");
  });

  it.skipIf(!hasDependency("mammoth") || !hasDependency("pdf-parse"))("survives the production-style ESM bundle without inherited loaders or pdf-parse debug entry errors", async () => {
    const { build } = await import("esbuild");
    const { spawn } = await import("node:child_process");
    const built = await build({
      entryPoints: [resolve(process.cwd(), "server/discordTranscriptParser.ts")],
      bundle: true,
      platform: "node",
      packages: "external",
      format: "esm",
      write: false,
    });
    const code = `${built.outputFiles[0].text}\nconst results = await Promise.all([
      parseTranscriptUpload({filename:"a.txt",base64:${JSON.stringify(Buffer.from("Grace.").toString("base64"))}}),
      parseTranscriptUpload({filename:"a.docx",base64:${JSON.stringify(docx().toString("base64"))}}),
      parseTranscriptUpload({filename:"a.pdf",base64:${JSON.stringify(pdf().toString("base64"))}})
    ]); console.log(JSON.stringify(results));`;
    const output = await new Promise<string>((resolveOutput, reject) => {
      const child = spawn(process.execPath, ["--input-type=module", "--eval", code], { cwd: process.cwd() });
      let stdout = "", stderr = "";
      child.stdout.on("data", chunk => { stdout += chunk; });
      child.stderr.on("data", chunk => { stderr += chunk; });
      const timeout = setTimeout(() => { child.kill(); reject(new Error("Bundled parser smoke test timed out")); }, 15000);
      child.once("error", error => { clearTimeout(timeout); reject(error); });
      child.once("exit", code => { clearTimeout(timeout); code === 0 ? resolveOutput(stdout) : reject(new Error(stderr)); });
    });
    const results = JSON.parse(output);
    expect(results.map((result: { paragraphs: string[] }) => result.paragraphs.length)).toEqual([1, 2, 2]);
    expect(results[0]).toEqual({ paragraphs: ["Grace."], warnings: [] });
    expect(results[1]).toEqual({ paragraphs: ["Grace & peace—today. A wrapped line.", "# A literal heading with **emphasis**."], warnings: [] });
    expect(results[2].paragraphs).toEqual(["Grace and peace. A wrapped line.", "A second paragraph."]);
    expect(results[2].warnings.join(" ")).toMatch(/best effort.*Review.*line breaks/);
  }, 20000);
});

describe("bounded worker lifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.doUnmock("node:worker_threads");
    vi.resetModules();
  });

  async function mockWorker(outcome: "success" | "error" | "exit" | "timeout" | "invalid" | "parser-error") {
    let options: Record<string, unknown> | undefined;
    let source = "";
    const terminate = vi.fn(async () => 0);
    class FakeWorker extends EventEmitter {
      terminate = terminate;
      constructor(code: string, opts: Record<string, unknown>) {
        super();
        source = code;
        options = opts;
        if (outcome !== "timeout") queueMicrotask(() => {
          if (outcome === "success") this.emit("message", { text: "Grace.", warnings: [] });
          else if (outcome === "error") this.emit("error", new Error("memory exhausted"));
          else if (outcome === "exit") this.emit("exit", 1);
          else if (outcome === "invalid") this.emit("message", { text: 5, warnings: [] });
          else this.emit("message", { error: "Cannot read document." });
        });
      }
    }
    vi.resetModules();
    vi.doMock("node:worker_threads", () => ({ Worker: FakeWorker }));
    const parser = await import("./discordTranscriptParser");
    return { parser, terminate, getOptions: () => options, getSource: () => source };
  }

  it("sets eval, empty execArgv, and memory/stack limits and terminates on success", async () => {
    const mocked = await mockWorker("success");
    await expect(mocked.parser.parseTranscriptUpload({ filename: "a.txt", base64: "Rw==" })).resolves.toEqual({ paragraphs: ["Grace."], warnings: [] });
    expect(mocked.getOptions()).toMatchObject({ eval: true, execArgv: [], resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 32, stackSizeMb: 4 } });
    expect(mocked.getSource()).toContain('require(workerData.modulePath)');
    expect(mocked.terminate).toHaveBeenCalledOnce();
  });

  it.each(["error", "exit", "invalid", "parser-error"] as const)("terminates when the worker reports %s", async outcome => {
    const mocked = await mockWorker(outcome);
    await expect(mocked.parser.parseTranscriptUpload({ filename: "a.txt", base64: "Rw==" })).rejects.toThrow();
    expect(mocked.terminate).toHaveBeenCalledOnce();
  });

  it("times out after ten seconds and awaits worker termination", async () => {
    const mocked = await mockWorker("timeout");
    vi.useFakeTimers();
    const result = expect(mocked.parser.parseTranscriptUpload({ filename: "a.txt", base64: "Rw==" })).rejects.toThrow(/timed out after 10 seconds/);
    await vi.advanceTimersByTimeAsync(10000);
    await result;
    expect(mocked.terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not create workers for invalid base64 or unsafe ZIP metadata", async () => {
    const mocked = await mockWorker("success");
    await expect(mocked.parser.parseTranscriptUpload({ filename: "a.txt", base64: "Rh==" })).rejects.toThrow(/canonical base64/);
    const bomb = docx();
    bomb.writeUInt32LE(9 * 1024 * 1024, centralOffset(bomb) + 24);
    await expect(mocked.parser.parseTranscriptUpload({ filename: "a.docx", base64: bomb.toString("base64") })).rejects.toThrow(/safe size/);
    expect(mocked.getOptions()).toBeUndefined();
    expect(mocked.terminate).not.toHaveBeenCalled();
  });
});
