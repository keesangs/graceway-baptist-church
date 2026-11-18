import { describe, expect, it } from "vitest";
import OpusScript from "opusscript";
import { DISCORD_FRAME_BYTES, SENTENCE_BOUNDARY, encodeDiscordOpus, smoothDiscordSentencePcm } from "./discordAudio";

function nonzeroEnds(frames: number) {
  const pcm = Buffer.alloc(frames * 4);
  for (let frame = 0; frame < frames; frame++) {
    const value = Math.round(14_000 * Math.cos(frame * 2 * Math.PI * 440 / 48_000));
    pcm.writeInt16LE(value, frame * 4);
    pcm.writeInt16LE(-Math.round(value / 2), frame * 4 + 2);
  }
  return pcm;
}

function legacyPackets(pcm: Buffer) {
  const encoder = new OpusScript(48_000, 2, OpusScript.Application.VOIP);
  try {
    encoder.encoderCTL(4002, 64_000);
    encoder.encoderCTL(4010, 5);
    encoder.encoderCTL(4012, 1);
    encoder.encoderCTL(4014, 5);
    const packets: Buffer[] = [];
    for (let i = 0; i < 5; i++) packets.push(Buffer.from(encoder.encode(Buffer.alloc(DISCORD_FRAME_BYTES), 960)));
    for (let offset = 0; offset < pcm.length; offset += DISCORD_FRAME_BYTES) {
      const frame = Buffer.alloc(DISCORD_FRAME_BYTES);
      pcm.copy(frame, 0, offset, Math.min(offset + DISCORD_FRAME_BYTES, pcm.length));
      packets.push(Buffer.from(encoder.encode(frame, 960)));
    }
    return packets;
  } finally { encoder.delete(); }
}

function decode(packets: Buffer[], decoder: OpusScript) {
  return Buffer.concat(packets.map(packet => Buffer.from(decoder.decode(packet))));
}

function maximumJump(pcm: Buffer, startFrame: number, endFrame: number) {
  let max = 0;
  for (let frame = Math.max(1, startFrame); frame < Math.min(pcm.length / 4, endFrame); frame++) {
    max = Math.max(max, Math.abs(pcm.readInt16LE(frame * 4) - pcm.readInt16LE((frame - 1) * 4)));
  }
  return max;
}

function rms(pcm: Buffer) {
  let sum = 0;
  for (let frame = 0; frame < pcm.length / 4; frame++) sum += pcm.readInt16LE(frame * 4) ** 2;
  return Math.sqrt(sum / (pcm.length / 4));
}

const canonicalSilence = () => Array.from({ length: 5 }, () => Buffer.from([0xf8, 0xff, 0xfe]));

describe("sentence boundary smoothing", () => {
  it.each([960 * 10, 960 * 10 + 37])("tapers real PCM endpoints before padding, preserves the middle and source (%i frames)", frames => {
    const pcm = nonzeroEnds(frames);
    const original = Buffer.from(pcm);
    const smoothed = smoothDiscordSentencePcm(pcm);
    expect(smoothed).not.toBe(pcm);
    expect(pcm).toEqual(original);
    expect(smoothed).toHaveLength(pcm.length);
    expect(smoothed.readInt16LE(0)).toBe(0);
    expect(smoothed.readInt16LE(2)).toBe(0);
    expect(smoothed.readInt16LE(smoothed.length - 4)).toBe(0);
    expect(smoothed.readInt16LE(smoothed.length - 2)).toBe(0);
    expect(smoothed.subarray(48 * SENTENCE_BOUNDARY.fadeInMs * 4, smoothed.length - 48 * SENTENCE_BOUNDARY.fadeOutMs * 4))
      .toEqual(pcm.subarray(48 * SENTENCE_BOUNDARY.fadeInMs * 4, pcm.length - 48 * SENTENCE_BOUNDARY.fadeOutMs * 4));
    for (let frame = 0; frame < frames; frame++) {
      expect(Math.abs(smoothed.readInt16LE(frame * 4))).toBeLessThanOrEqual(Math.abs(pcm.readInt16LE(frame * 4)));
      expect(Math.abs(smoothed.readInt16LE(frame * 4 + 2))).toBeLessThanOrEqual(Math.abs(pcm.readInt16LE(frame * 4 + 2)));
      expect(Math.abs(smoothed.readInt16LE(frame * 4) + 2 * smoothed.readInt16LE(frame * 4 + 2))).toBeLessThanOrEqual(2);
    }
  });

  it.each([1, 2, 3, 100, 500])("safely clamps ramps on very short PCM (%i frames)", frames => {
    const pcm = nonzeroEnds(frames);
    const smoothed = smoothDiscordSentencePcm(pcm);
    expect(smoothed).toHaveLength(pcm.length);
    expect(smoothed.readInt16LE(0)).toBe(0);
    expect(smoothed.readInt16LE(smoothed.length - 2)).toBe(0);
  });

  it("leaves digital silence unchanged and rejects misaligned samples", () => {
    expect(smoothDiscordSentencePcm(Buffer.alloc(48_000 * 4))).toEqual(Buffer.alloc(48_000 * 4));
    expect(() => smoothDiscordSentencePcm(Buffer.alloc(0))).toThrow("complete");
    expect(() => smoothDiscordSentencePcm(Buffer.alloc(6))).toThrow("complete");
  });

  it("reduces synthetic decoded end discontinuity compared with the unfaded, unflushed path", async () => {
    const pcm = nonzeroEnds(960 * 10 + 37);
    const smoothed = await encodeDiscordOpus(pcm);
    const oldDecoder = new OpusScript(48_000, 2, OpusScript.Application.VOIP);
    const newDecoder = new OpusScript(48_000, 2, OpusScript.Application.VOIP);
    try {
      const oldAudio = decode([...legacyPackets(pcm), ...canonicalSilence()], oldDecoder);
      const newAudio = decode([...smoothed.packets, ...canonicalSilence()], newDecoder);
      // Include codec delay and the original partial-packet padding edge.
      const tailStart = 5 * 960 + pcm.length / 4 - 48 * 20;
      const tailEnd = 5 * 960 + pcm.length / 4 + 48 * 60;
      const oldJump = maximumJump(oldAudio, tailStart, tailEnd);
      const newJump = maximumJump(newAudio, tailStart, tailEnd);
      expect(newJump).toBeLessThan(oldJump);
      const lastEncodedTail = newAudio.subarray((smoothed.packets.length - 1) * DISCORD_FRAME_BYTES, smoothed.packets.length * DISCORD_FRAME_BYTES);
      expect(rms(lastEncodedTail)).toBeLessThan(100);
      expect(smoothed.audioDurationMs).toBeCloseTo(pcm.length / 192);
      console.info("[boundary-test] synthetic decoded tail", { oldJump, newJump, finalTailRms: rms(lastEncodedTail) });
    } finally { oldDecoder.delete(); newDecoder.delete(); }
  });

  it("decodes two separately encoded sentences through one continuing receiver, with canonical padding", async () => {
    const first = await encodeDiscordOpus(nonzeroEnds(960 * 10 + 37));
    const second = await encodeDiscordOpus(nonzeroEnds(960 * 10));
    const decoder = new OpusScript(48_000, 2, OpusScript.Application.VOIP);
    const freshDecoder = new OpusScript(48_000, 2, OpusScript.Application.VOIP);
    try {
      decode([...first.packets, ...canonicalSilence()], decoder);
      const continuing = decode([...second.packets, ...canonicalSilence()], decoder);
      const fresh = decode([...second.packets, ...canonicalSilence()], freshDecoder);
      expect(continuing.length).toBe((second.packets.length + 5) * DISCORD_FRAME_BYTES);
      expect(fresh.length).toBe(continuing.length);
      // A sender cannot force the remote decoder to reset. Check both states;
      // do not assert exact decoded silence or universal listener quality.
      const settlingEnd = 5 * DISCORD_FRAME_BYTES;
      expect(rms(continuing.subarray(settlingEnd - DISCORD_FRAME_BYTES, settlingEnd))).toBeLessThan(100);
      expect(rms(fresh.subarray(settlingEnd - DISCORD_FRAME_BYTES, settlingEnd))).toBeLessThan(100);
      expect(second.packets).toHaveLength(5 + 10 + 3);
    } finally { decoder.delete(); freshDecoder.delete(); }
  });
});
