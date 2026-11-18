import { beforeEach, describe, expect, it, vi } from "vitest";
const memory = vi.hoisted(() => ({ docs: new Map<number, any>(), runs: new Map<string, any>(), live: new Map<string, any>(), callbacks: new Map<string, (v:any)=>void>(), queued: [] as any[], state: "connected", depth: 0, current: null as string|null }));
vi.mock("./db", () => ({
  listDiscordTranscripts: async () => Array.from(memory.docs.values()).map(({ paragraphs, ...d }) => ({ ...d, paragraphCount: paragraphs.length })),
  getDiscordTranscript: async (id:number) => memory.docs.get(id) ?? null,
  insertDiscordTranscript: async (input:any) => { const d={ ...input,id:memory.docs.size+1,nextParagraph:0,createdAt:1,updatedAt:1 };memory.docs.set(d.id,d);return d; },
  deleteDiscordTranscript: async (id:number) => {memory.docs.delete(id);for(const [k,v] of Array.from(memory.runs.entries()))if(v.transcriptId===id)memory.runs.delete(k);},
  getDiscordTranscriptRun: async (id:string) => memory.runs.get(id) ?? null,
  getLatestDiscordTranscriptRun: async (id:number,index?:number) => Array.from(memory.runs.values()).filter(v=>v.transcriptId===id&&(index===undefined||v.paragraphIndex===index)).at(-1) ?? null,
  insertDiscordTranscriptRun: async (input:any) => {memory.runs.set(input.id,{...input});},
  updateDiscordTranscriptRun: async (id:string,update:any,next?:{id:number;next:number}) => { Object.assign(memory.runs.get(id),update);if(next){const d=memory.docs.get(next.id);d.nextParagraph=Math.max(d.nextParagraph,next.next);} },
}));
vi.mock("./discordBot", () => ({
  getDiscordBotStatus: () => ({state:memory.state,currentText:memory.current,queueDepth:memory.depth,instanceId:"unit-runtime"}),
  getDiscordParagraphBatch: (id:string) => memory.live.get(id) ?? null,
  splitDiscordTextIntoSentences: (text:string) => text.split(/(?<=[.!?])\s+/),
  queueDiscordTranscriptParagraph: (input:any,cb:any) => {const value={id:input.id,transcriptId:input.transcriptId,paragraphIndex:input.paragraphIndex,status:"queued",sentenceCount:input.text.split(/(?<=[.!?])\s+/).length,completedCount:0,error:null};memory.queued.push(input);memory.live.set(input.id,value);memory.callbacks.set(input.id,cb);cb(value);return value;},
}));
let api: typeof import("./discordTranscript").discordTranscriptRouter;
const uuid="ed4c54cb-8a99-420f-94a1-f2bf6e1e88ac";
function caller(role:"admin"|"user"|null="admin") {return api.createCaller({user:role?{id:3,role}:null,req:{headers:{}},res:{}} as any);}
beforeEach(async ()=>{vi.resetModules();memory.docs.clear();memory.runs.clear();memory.live.clear();memory.callbacks.clear();memory.queued.length=0;memory.state="connected";memory.depth=0;memory.current=null;api=(await import("./discordTranscript")).discordTranscriptRouter;});
async function create(){return caller().importText({title:"Sunday draft",text:"First paragraph. Welcome.\n\nSecond paragraph stays silent."});}
describe("private transcript administrator API",()=>{
  it("rejects unauthenticated and ordinary users from reads and sends",async()=>{
    await expect(caller(null).list()).rejects.toMatchObject({code:"FORBIDDEN"});
    await expect(caller("user").list()).rejects.toMatchObject({code:"FORBIDDEN"});
    await expect(caller("user").sendParagraph({id:1,index:0,requestId:uuid,replay:false})).rejects.toMatchObject({code:"FORBIDDEN"});
  });
  it("imports parsed paragraphs privately without queueing or retaining original bytes",async()=>{
    const doc=await create();expect(doc.paragraphs).toEqual(["First paragraph. Welcome.","Second paragraph stays silent."]);expect(memory.queued).toHaveLength(0);expect(doc.nextParagraph).toBe(0);
    const list=await caller().list();expect(list[0]).toHaveProperty("paragraphCount",2);expect(list[0]).not.toHaveProperty("paragraphs");
  });
  it("accepts a txt upload but never sends on import",async()=>{
    const doc=await caller().importFile({title:"Imported",filename:"sermon.txt",mimeType:"text/plain",base64:Buffer.from("Welcome.\n\nAmen.").toString("base64")});expect(doc.paragraphs).toHaveLength(2);expect(doc.filename).toBe("sermon.txt");expect(memory.queued).toHaveLength(0);expect(memory.docs.get(doc.id)).not.toHaveProperty("base64");
  });
  it("rejects unreadable uploads and invalid paragraph indices",async()=>{
    await expect(caller().importFile({title:"Bad",filename:"sermon.exe",mimeType:"application/octet-stream",base64:Buffer.from("Bad").toString("base64")})).rejects.toMatchObject({code:"BAD_REQUEST"});
    const doc=await create();await expect(caller().sendParagraph({id:doc.id,index:99,requestId:uuid,replay:false})).rejects.toMatchObject({code:"BAD_REQUEST"});
  });
  it("admits one selected paragraph, deduplicates request IDs, advances only after completion",async()=>{
    const doc=await create();const payload={id:doc.id,index:0,requestId:uuid,replay:false};
    const first=await caller().sendParagraph(payload);expect(first.sentenceCount).toBe(2);expect(memory.queued).toHaveLength(1);expect(memory.queued[0].text).toBe("First paragraph. Welcome.");expect(memory.docs.get(doc.id).nextParagraph).toBe(0);
    await caller().sendParagraph(payload);expect(memory.queued).toHaveLength(1);
    const final={...memory.live.get(uuid),status:"completed",completedCount:2};memory.live.set(uuid,final);memory.callbacks.get(uuid)!(final);
    await vi.waitFor(()=>expect(memory.docs.get(doc.id).nextParagraph).toBe(1));expect(memory.queued).toHaveLength(1);
  });
  it("requires explicit full paragraph replay after prior attempt",async()=>{
    const doc=await create();await caller().sendParagraph({id:doc.id,index:0,requestId:uuid,replay:false});
    const second="032a357d-4f57-4b66-a33b-e839111d2171";
    await expect(caller().sendParagraph({id:doc.id,index:0,requestId:second,replay:false})).rejects.toMatchObject({code:"CONFLICT"});
    memory.live.set(uuid,{...memory.live.get(uuid),status:"completed",completedCount:2});
    await caller().sendParagraph({id:doc.id,index:0,requestId:second,replay:true});expect(memory.queued).toHaveLength(2);
  });
  it("rejects disconnected and busy admission",async()=>{
    const doc=await create();memory.state="stopped";
    await expect(caller().sendParagraph({id:doc.id,index:0,requestId:uuid,replay:false})).rejects.toMatchObject({code:"PRECONDITION_FAILED"});
    memory.state="connected";memory.depth=1;
    await expect(caller().sendParagraph({id:doc.id,index:0,requestId:uuid,replay:false})).rejects.toMatchObject({code:"CONFLICT"});expect(memory.queued).toHaveLength(0);
  });
  it("marks unknown old-runtime runs interrupted without replay or cursor advancement",async()=>{
    const doc=await create();memory.runs.set(uuid,{id:uuid,transcriptId:doc.id,paragraphIndex:0,status:"playing",sentenceCount:2,completedCount:1,error:null,runtimeId:"retired"});
    const view=await caller().get({id:doc.id});expect(view.lastRun?.status).toBe("interrupted");expect(view.nextParagraph).toBe(0);expect(memory.queued).toHaveLength(0);
  });
  it("blocks deletion during active playback, deletes a stopped private draft",async()=>{
    const doc=await create();await caller().sendParagraph({id:doc.id,index:0,requestId:uuid,replay:false});
    await expect(caller().delete({id:doc.id})).rejects.toMatchObject({code:"CONFLICT"});
    const cancelled={...memory.live.get(uuid),status:"cancelled",error:"Stopped"};memory.live.set(uuid,cancelled);memory.callbacks.get(uuid)!(cancelled);
    expect(await caller().delete({id:doc.id})).toEqual({deleted:true});expect(memory.docs.size).toBe(0);expect(memory.runs.size).toBe(0);
  });
});
