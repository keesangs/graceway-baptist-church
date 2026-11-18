import { describe, expect, it } from "vitest";
import OpusScript from "opusscript";
import { AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, entersState } from "@discordjs/voice";
import { createBufferedOpusResource, discordPcmToWav, encodeDiscordOpus } from "./discordAudio";
import { convertAudioForDiscord } from "./discordTts";

function tone(frames: number) {
  const pcm = Buffer.alloc(frames * 4);
  for (let i = 0; i < frames; i++) {
    const sample = Math.round(Math.sin(i * 2 * Math.PI * 440 / 48_000) * 8000);
    pcm.writeInt16LE(sample, i * 4);
    pcm.writeInt16LE(sample, i * 4 + 2);
  }
  return pcm;
}

describe("buffered Discord audio behavior", () => {
  it("encodes complete individual 20 ms packets, including a partial last frame, without native Opus or ffmpeg", async () => {
    const pcm = tone(960 * 8 + 37);
    const result = await encodeDiscordOpus(pcm);
    expect(result.codec).toBe("opusscript-worker");
    expect(result.packets).toHaveLength(5 + 9);
    const decoder = new OpusScript(48_000, 2, OpusScript.Application.VOIP);
    try {
      for (const packet of result.packets) expect(decoder.decode(packet)).toHaveLength(960 * 4);
    } finally { decoder.delete(); }
    expect(result.audioDurationMs).toBeCloseTo(pcm.length / 192);
  });

  it("plays a whole buffered resource without underflow or an encoder transform in the timed player", async () => {
    const audio = await encodeDiscordOpus(tone(960 * 10));
    const { resource, diagnostics } = createBufferedOpusResource(audio);
    expect(resource.edges).toHaveLength(0);
    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    const states: string[] = [];
    player.on("stateChange", (_old, next) => states.push(next.status));
    player.play(resource);
    // play() changes state synchronously; old Idle does not remain current.
    expect(player.state.status).not.toBe(AudioPlayerStatus.Idle);
    try {
      await entersState(player, AudioPlayerStatus.Playing, 2000);
      await entersState(player, AudioPlayerStatus.Idle, 3000);
      expect(states).toContain(AudioPlayerStatus.Playing);
      // AudioResource.playbackDuration counts content, not trailing silence.
      expect(resource.playbackDuration).toBe(audio.packets.length * 20);
      expect(diagnostics.underflowReads).toBe(0);
      expect(diagnostics.packetReads).toBe(audio.packets.length + 5);
    } finally { player.stop(true); }
  });

  it("can stop playback promptly without leaving an active resource", async () => {
    const audio = await encodeDiscordOpus(tone(48_000));
    const { resource } = createBufferedOpusResource(audio);
    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    player.play(resource);
    await entersState(player, AudioPlayerStatus.Playing, 2000);
    player.stop(true);
    expect(player.state.status).toBe(AudioPlayerStatus.Idle);
    expect(resource.ended).toBe(true);
  });

  it("rejects empty or misaligned PCM rather than playing a malformed buffer", async () => {
    await expect(encodeDiscordOpus(Buffer.alloc(0))).rejects.toThrow("complete");
    await expect(encodeDiscordOpus(Buffer.alloc(7))).rejects.toThrow("complete");
  });

  it("preserves duration and samples of already-48k stereo PCM through a WAV conversion", async () => {
    const pcm = tone(48_000);
    const wav = discordPcmToWav(pcm);
    const converted = await convertAudioForDiscord(wav, "wav");
    expect(converted).toHaveLength(pcm.length);
    for (let i = 0; i < 48_000; i += 103) {
      expect(Math.abs(converted.readInt16LE(i * 4) - pcm.readInt16LE(i * 4))).toBeLessThanOrEqual(1);
      expect(converted.readInt16LE(i * 4)).toBe(converted.readInt16LE(i * 4 + 2));
    }
  });
});
