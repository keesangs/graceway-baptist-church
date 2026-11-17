import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { Client, GatewayIntentBits, PermissionFlagsBits } from "discord.js";
import {
  AudioPlayerStatus,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  type VoiceConnection,
} from "@discordjs/voice";
import { convertAudioForDiscord, getDiscordTtsStatus, synthesizeDiscordText, type DiscordTtsSettings, type TtsEngine } from "./discordTts";

export type DiscordBotRuntimeState = "disabled" | "starting" | "connected" | "paused" | "error" | "stopped";

type HistoryItem = {
  id: string;
  text: string;
  engine: TtsEngine | null;
  status: "queued" | "playing" | "completed" | "failed";
  latencyMs: number | null;
  error: string | null;
  errorCode: VoiceFailureCode | null;
  createdAt: string;
};

export type VoiceFailureCode =
  | "configuration_invalid"
  | "connection_unavailable"
  | "synthesis_failed"
  | "audio_conversion_failed"
  | "voice_playback_failed"
  | "unknown";

type VoiceFailureStage = "synthesis" | "audio_conversion" | "voice_playback";

type BotStatus = {
  state: DiscordBotRuntimeState;
  botUser: string | null;
  guildId: string;
  textChannelId: string;
  voiceChannelId: string;
  allowedUserId: string;
  queueDepth: number;
  currentText: string | null;
  lastError: string | null;
  lastErrorCode: VoiceFailureCode | null;
  lastFailed: HistoryItem | null;
  history: HistoryItem[];
};

const config = {
  guildId: process.env.DISCORD_TRANSLATION_GUILD_ID ?? "1558754920692457624",
  textChannelId: process.env.DISCORD_TRANSLATION_TEXT_CHANNEL_ID ?? "1558763380708216903",
  voiceChannelId: process.env.DISCORD_TRANSLATION_VOICE_CHANNEL_ID ?? "1558754922277765213",
  allowedUserId: process.env.DISCORD_TRANSLATION_ALLOWED_USER_ID ?? "438023171459776525",
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
});
const player = createAudioPlayer();
let connection: VoiceConnection | undefined;
let started = false;
let listenersInstalled = false;
let processing = false;
let currentText: string | null = null;
let lastError: string | null = null;
let lastErrorCode: VoiceFailureCode | null = null;
let runtimeState: DiscordBotRuntimeState = "stopped";
const queue: HistoryItem[] = [];
const history: HistoryItem[] = [];

function addHistory(item: HistoryItem) {
  history.unshift(item);
  if (history.length > 50) history.length = 50;
}

export function splitDiscordTextIntoSentences(text: string, maxLength = 400): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const chunks = normalized.split(/(?<=[.!?。！？])\s+/).filter(Boolean);
  const result: string[] = [];
  for (const chunk of chunks.length ? chunks : [normalized]) {
    if (chunk.length <= maxLength) {
      result.push(chunk);
      continue;
    }
    for (let start = 0; start < chunk.length; start += maxLength) result.push(chunk.slice(start, start + maxLength).trim());
  }
  return result.filter(Boolean);
}

function markError(item: HistoryItem, stage: VoiceFailureStage, error: unknown) {
  const failures = {
    synthesis: { code: "synthesis_failed" as const, message: "음성 합성에 실패했습니다. DeepInfra 연결 또는 API 설정을 확인해 주세요." },
    audio_conversion: { code: "audio_conversion_failed" as const, message: "생성된 오디오를 Discord 형식으로 변환하지 못했습니다." },
    voice_playback: { code: "voice_playback_failed" as const, message: "Discord 음성 채널로 송출하지 못했습니다. 봇 연결과 음성 권한을 확인해 주세요." },
  };
  const failure = failures[stage];
  item.status = "failed";
  item.error = failure.message;
  item.errorCode = failure.code;
  lastError = failure.message;
  lastErrorCode = failure.code;
  addHistory(item);
}

async function playPcm(pcm: Buffer) {
  if (!connection) throw new Error("Discord voice connection is not ready");
  const resource = createAudioResource(Readable.from(pcm), { inputType: StreamType.Raw });
  connection.subscribe(player);
  player.play(resource);
  await entersState(player, AudioPlayerStatus.Idle, 120_000);
}

async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    while (queue.length && runtimeState !== "paused") {
      const item = queue.shift()!;
      currentText = item.text;
      item.status = "playing";
      let stage: VoiceFailureStage = "synthesis";
      try {
        const result = await synthesizeDiscordText(item.text);
        item.engine = result.engine;
        item.latencyMs = result.latencyMs;
        stage = "audio_conversion";
        const pcm = await convertAudioForDiscord(result.audio, result.format);
        stage = "voice_playback";
        await playPcm(pcm);
        item.status = "completed";
        lastError = null;
        lastErrorCode = null;
        addHistory(item);
      } catch (error) {
        markError(item, stage, error);
      } finally {
        currentText = null;
      }
    }
  } finally {
    processing = false;
  }
}

function enqueueText(text: string) {
  for (const sentence of splitDiscordTextIntoSentences(text)) {
    const item: HistoryItem = {
      id: randomUUID(),
      text: sentence,
      engine: null,
      status: "queued",
      latencyMs: null,
      error: null,
      errorCode: null,
      createdAt: new Date().toISOString(),
    };
    queue.push(item);
  }
  void processQueue();
}

export async function enqueueDiscordTtsSmokeMessages(messages: string[]) {
  if (runtimeState !== "connected" || !connection) throw new Error("Discord bot is not connected to the configured voice channel");
  messages.forEach(enqueueText);
  await new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (!processing && queue.length === 0) {
        clearInterval(timer);
        resolve();
      }
    }, 250);
  });
  return history.slice(0, messages.length);
}

export async function retryLastDiscordTtsMessage() {
  const failed = history.find(item => item.status === "failed");
  if (runtimeState !== "connected") {
    let next = getDiscordBotStatus();
    for (let attempt = 0; attempt < 3 && next.state !== "connected"; attempt += 1) {
      if (started) await stopDiscordTtsBot();
      await new Promise(resolve => setTimeout(resolve, 750 * (attempt + 1)));
      next = await startDiscordTtsBot();
    }
    if (next.state !== "connected") throw new Error(next.lastError ?? "Discord 음성 연결을 시작하지 못했습니다.");
    if (!failed) return { retried: false, reconnected: true, message: "Discord 음성 연결을 다시 시작했습니다. 이제 문장을 입력해 주세요." } as const;
  }
  if (!failed) return { retried: false, reconnected: false, message: "재시도할 실패 메시지가 없습니다." } as const;
  queue.unshift({
    ...failed,
    id: randomUUID(),
    status: "queued",
    engine: null,
    latencyMs: null,
    error: null,
    errorCode: null,
    createdAt: new Date().toISOString(),
  });
  void processQueue();
  return { retried: true, message: "마지막 실패 메시지를 다시 송출 대기열에 추가했습니다." } as const;
}

function installListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  client.on("messageCreate", (message) => {
    if (runtimeState !== "connected") return;
    if (!message.guildId || message.guildId !== config.guildId) return;
    if (message.channelId !== config.textChannelId) return;
    if (message.author.bot || message.author.id !== config.allowedUserId) return;
    enqueueText(message.content);
  });
  client.on("error", (error) => {
    runtimeState = "error";
    lastError = error.message;
  });
}

export async function startDiscordTtsBot() {
  if (started) {
    if (runtimeState === "paused") {
      runtimeState = "connected";
      void processQueue();
    }
    return getDiscordBotStatus();
  }
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token || process.env.DISCORD_TTS_BOT_ENABLED === "false") {
    runtimeState = "disabled";
    return getDiscordBotStatus();
  }

  started = true;
  runtimeState = "starting";
  installListeners();
  let stage = "login";
  try {
    await client.login(token);
    stage = "guild lookup";
    const guild = await client.guilds.fetch(config.guildId);
    stage = "text channel lookup";
    const textChannel = await guild.channels.fetch(config.textChannelId);
    if (!textChannel?.isTextBased()) throw new Error(`Configured text channel ${config.textChannelId} was not found or is not text-based`);
    stage = "voice channel lookup";
    const channel = await guild.channels.fetch(config.voiceChannelId);
    if (!channel?.isVoiceBased()) throw new Error(`Configured voice channel ${config.voiceChannelId} was not found or is not voice-based`);
    const botMember = await guild.members.fetch(client.user!.id);
    const permissions = channel.permissionsFor(botMember);
    const requiredPermissions: Array<[bigint, string]> = [
      [PermissionFlagsBits.ViewChannel, "View Channel"],
      [PermissionFlagsBits.Connect, "Connect"],
      [PermissionFlagsBits.Speak, "Speak"],
    ];
    const missingPermissions = requiredPermissions.filter(([permission]) => !permissions?.has(permission as never)).map(([, label]) => label);
    if (missingPermissions.length) throw new Error(`Missing voice permissions: ${missingPermissions.join(", ")}`);
    stage = "voice connection";
    connection = joinVoiceChannel({ channelId: channel.id, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator, selfDeaf: false });
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    connection.on("stateChange", (_oldState, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        runtimeState = "error";
        lastErrorCode = "connection_unavailable";
        lastError = "Discord 음성 연결이 끊어졌습니다. 재시도 버튼으로 다시 연결해 주세요.";
      }
    });
    connection.on("error", () => {
      runtimeState = "error";
      lastErrorCode = "connection_unavailable";
      lastError = "Discord 음성 연결에서 오류가 발생했습니다. 봇 연결과 음성 권한을 확인한 뒤 재시도해 주세요.";
    });
    runtimeState = "connected";
    lastError = null;
    lastErrorCode = null;
  } catch (error) {
    started = false;
    connection?.destroy();
    connection = undefined;
    if (client.isReady()) client.destroy();
    runtimeState = "error";
    lastError = stage === "voice connection"
      ? "Discord 음성 채널에 연결하지 못했습니다. 봇 연결과 음성 권한을 확인한 뒤 재시도해 주세요."
      : stage === "text channel lookup" || stage === "voice channel lookup" || stage === "guild lookup"
        ? "Discord 서버 또는 채널 설정을 확인해 주세요. 서버·Text 채널·음성 채널 ID가 올바른지 확인해야 합니다."
      : `Discord ${stage} failed: ${error instanceof Error ? error.message : String(error)}`;
    lastErrorCode = stage === "voice connection"
      ? "connection_unavailable"
      : stage === "text channel lookup" || stage === "voice channel lookup" || stage === "guild lookup"
        ? "configuration_invalid"
        : "unknown";
  }
  return getDiscordBotStatus();
}

export async function stopDiscordTtsBot() {
  queue.length = 0;
  currentText = null;
  connection?.destroy();
  connection = undefined;
  if (client.isReady()) client.destroy();
  started = false;
  runtimeState = "stopped";
  return getDiscordBotStatus();
}

export function pauseDiscordTtsBot() {
  if (runtimeState === "connected" || runtimeState === "starting") runtimeState = "paused";
  return getDiscordBotStatus();
}

export function getDiscordBotStatus(): BotStatus & { tts: ReturnType<typeof getDiscordTtsStatus>; settings: DiscordTtsSettings } {
  return {
    state: runtimeState,
    botUser: client.user?.tag ?? null,
    guildId: config.guildId,
    textChannelId: config.textChannelId,
    voiceChannelId: config.voiceChannelId,
    allowedUserId: config.allowedUserId,
    queueDepth: queue.length,
    currentText,
    lastError,
    lastErrorCode,
    lastFailed: history.find(item => item.status === "failed") ?? null,
    history: [...history],
    tts: getDiscordTtsStatus(),
    settings: getDiscordTtsStatus().settings,
  };
}

export function resetDiscordBotForTests() {
  queue.length = 0;
  history.length = 0;
  currentText = null;
  lastError = null;
  runtimeState = "stopped";
  processing = false;
}
