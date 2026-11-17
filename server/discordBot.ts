import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { Client, GatewayIntentBits } from "discord.js";
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
  createdAt: string;
};

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

function markError(item: HistoryItem, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  item.status = "failed";
  item.error = message;
  lastError = message;
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
      try {
        const result = await synthesizeDiscordText(item.text);
        item.engine = result.engine;
        item.latencyMs = result.latencyMs;
        const pcm = await convertAudioForDiscord(result.audio, result.format);
        await playPcm(pcm);
        item.status = "completed";
        addHistory(item);
      } catch (error) {
        markError(item, error);
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
    stage = "voice channel lookup";
    const channel = await guild.channels.fetch(config.voiceChannelId);
    if (!channel?.isVoiceBased()) throw new Error(`Configured voice channel ${config.voiceChannelId} was not found or is not voice-based`);
    stage = "voice connection";
    connection = joinVoiceChannel({ channelId: channel.id, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator, selfDeaf: false });
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    connection.on("stateChange", (_oldState, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) runtimeState = "error";
    });
    runtimeState = "connected";
    lastError = null;
  } catch (error) {
    started = false;
    connection?.destroy();
    connection = undefined;
    if (client.isReady()) client.destroy();
    runtimeState = "error";
    lastError = `Discord ${stage} failed: ${error instanceof Error ? error.message : String(error)}`;
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
