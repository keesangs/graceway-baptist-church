import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { splitDiscordTextIntoSentences } from "./discordBot";

const runtimeSource = readFileSync(resolve(process.cwd(), "server/discordBot.ts"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/pages/DiscordTtsAdmin.tsx"), "utf8");

describe("Discord live worship TTS runtime", () => {
  it("splits sentence-sized messages and bounds long chunks", () => {
    const sentences = splitDiscordTextIntoSentences("Welcome. Please stand and sing! This is the next line?", 400);
    expect(sentences).toEqual(["Welcome.", "Please stand and sing!", "This is the next line?"]);

    const long = splitDiscordTextIntoSentences("a".repeat(805), 400);
    expect(long).toHaveLength(3);
    expect(Math.max(...long.map((item) => item.length))).toBeLessThanOrEqual(400);
  });

  it("keeps Discord intake restricted to the configured guild, channel, and Admin account", () => {
    expect(runtimeSource).toContain("message.guildId !== config.guildId");
    expect(runtimeSource).toContain("message.channelId !== config.textChannelId");
    expect(runtimeSource).toContain("message.author.id !== config.allowedUserId");
    expect(runtimeSource).toContain("GatewayIntentBits.MessageContent");
    expect(runtimeSource).toContain("GatewayIntentBits.GuildVoiceStates");
    expect(runtimeSource).toContain("convertAudioForDiscord(result.audio, result.format)");
    expect(runtimeSource).toContain("guild.channels.fetch(config.textChannelId)");
    expect(runtimeSource).toContain("PermissionFlagsBits.Connect");
    expect(runtimeSource).toContain("PermissionFlagsBits.Speak");
    expect(runtimeSource).toContain("Register handlers immediately");
    expect(runtimeSource).toContain("connection.on(\"error\", (error)");
    expect(runtimeSource).toContain("scheduleVoiceRecovery");
    expect(runtimeSource).toContain("connection.rejoin()");
    expect(runtimeSource).toContain('"reconnecting"');
    expect(runtimeSource).toContain("Discord 음성 채널에 연결하지 못했습니다.");
    expect(runtimeSource).toContain("${detail ? ` 원인: ${detail}` : \"\"}");
  });

  it("exposes safe admin bot controls and live status polling", () => {
    expect(routerSource).toContain("botStatus: adminProcedure");
    expect(routerSource).toContain("startBot: adminProcedure");
    expect(routerSource).toContain("pauseBot: adminProcedure");
    expect(routerSource).toContain("stopBot: adminProcedure");
    expect(dashboardSource).toContain("Discord voice runtime");
    expect(dashboardSource).toContain("refetchInterval: 2_000");
    expect(dashboardSource).toContain("Start bot");
    expect(dashboardSource).toContain("Pause queue");
    expect(dashboardSource).toContain("Stop bot");
  });

  it("surfaces stage-specific voice failures and a protected manual retry", () => {
    expect(runtimeSource).toContain("lastErrorCode");
    expect(runtimeSource).toContain("lastFailed");
    expect(runtimeSource).toContain("voice_playback_failed");
    expect(runtimeSource).toContain("retryLastDiscordTtsMessage");
    expect(runtimeSource).toContain("reconnected: true");
    expect(routerSource).toContain("retryLastMessage: adminProcedure");
    expect(dashboardSource).toContain("음성 송출에 문제가 발생했습니다");
    expect(dashboardSource).toContain("마지막 메시지 재시도");
    expect(dashboardSource).toContain("음성 연결 재시도");
    expect(dashboardSource).toContain("lastErrorCode !== \"connection_unavailable\"");
    expect(dashboardSource).toContain("retryMessageMutation");
    expect(runtimeSource).toContain("원인:");
    expect(dashboardSource).toContain("자동 재연결 중");
  });
});
