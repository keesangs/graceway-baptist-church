import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createBufferedOpusResource, encodeDiscordOpus, type PlaybackDiagnostics } from "./discordAudio";
import { summarizeVoiceConnection, voiceTimeoutMessage } from "./discordVoiceDiagnostics";
import { Client, Events, GatewayIntentBits, PermissionFlagsBits } from "discord.js";
import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  entersState,
  joinVoiceChannel,
  type VoiceConnection,
} from "@discordjs/voice";
import { convertAudioForDiscord, getDiscordTtsStatus, synthesizeDiscordText, type DiscordTtsSettings, type TtsEngine } from "./discordTts";

export type DiscordBotRuntimeState = "disabled" | "starting" | "reconnecting" | "connected" | "paused" | "error" | "stopped";

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
  instanceId: string;
  playback: PlaybackDiagnostics | null;
  voicePing: { ws: number | null; udp: number | null };
  connectionDiagnostics: {
    stage: string;
    voiceState: string;
    networkPhase: string;
    startupRetryAttempts: number;
    transitions: Array<{ at: number; voiceState: string; networkPhase: string }>;
  };
};

const config = {
  guildId: process.env.DISCORD_TRANSLATION_GUILD_ID ?? "1558754920692457624",
  textChannelId: process.env.DISCORD_TRANSLATION_TEXT_CHANNEL_ID ?? "1558763380708216903",
  voiceChannelId: process.env.DISCORD_TRANSLATION_VOICE_CHANNEL_ID ?? "1558754922277765213",
  allowedUserId: process.env.DISCORD_TRANSLATION_ALLOWED_USER_ID ?? "438023171459776525",
};

function createDiscordClient() {
  return new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
  });
}
let client = createDiscordClient();
const player = createAudioPlayer();
let connection: VoiceConnection | undefined;
let started = false;
let listenersInstalled = false;
let playerListenerInstalled = false;
let processing = false;
let currentText: string | null = null;
let lastError: string | null = null;
let lastErrorCode: VoiceFailureCode | null = null;
let runtimeState: DiscordBotRuntimeState = "stopped";
let recoveryTimer: NodeJS.Timeout | undefined;
let recoveryAttempts = 0;
let startupRetryTimer: NodeJS.Timeout | undefined;
let startupRetryAttempts = 0;
let startupPromise: Promise<ReturnType<typeof getDiscordBotStatus>> | undefined;
const instanceId = randomUUID().slice(0, 8);
let playback: PlaybackDiagnostics | null = null;
let queueGeneration = 0;
let connectionStage = "not-started";
let voiceSnapshot = summarizeVoiceConnection(undefined);
const voiceTransitions: Array<{ at: number; voiceState: string; networkPhase: string }> = [];
const queue: HistoryItem[] = [];
const history: HistoryItem[] = [];

function recordVoiceSnapshot(state: unknown) {
  const next = summarizeVoiceConnection(state);
  if (next.voiceState !== voiceSnapshot.voiceState || next.networkPhase !== voiceSnapshot.networkPhase) {
    voiceTransitions.push({ at: Date.now(), ...next });
    if (voiceTransitions.length > 20) voiceTransitions.shift();
  }
  voiceSnapshot = next;
}

function addHistory(item: HistoryItem) {
  history.unshift(item);
  if (history.length > 50) history.length = 50;
}

export function splitDiscordTextIntoSentences(text: string, maxLength = 400): string[] {
  const normalized = text.replace(/[ \t]+/g, " ").trim();
  if (!normalized) return [];
  // Split both conventional "A. B" boundaries and adjacent boundaries such
  // as "A.B" while leaving decimal numbers like 3.14 intact. Newlines are
  // treated as whitespace boundaries by the first branch.
  const chunks = normalized.split(/(?<=[.!?。！？])\s+|(?<=[.!?。！？])(?=[A-Za-z가-힣])/).filter(Boolean);
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
  const detail = error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 220) : String(error).replace(/\s+/g, " ").slice(0, 220);
  item.error = detail ? `${failure.message} 원인: ${detail}` : failure.message;
  item.errorCode = failure.code;
  lastError = item.error;
  lastErrorCode = failure.code;
  addHistory(item);
}

function scheduleVoiceRecovery(error: unknown) {
  if (!connection || !started || recoveryTimer) return;
  const detail = error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 220) : String(error).replace(/\s+/g, " ").slice(0, 220);
  const attempt = recoveryAttempts + 1;
  if (attempt > 5) {
    runtimeState = "error";
    lastErrorCode = "connection_unavailable";
    lastError = detail
      ? `Discord 음성 연결이 복구되지 않았습니다. 재시도 버튼을 눌러 주세요. 원인: ${detail}`
      : "Discord 음성 연결이 복구되지 않았습니다. 재시도 버튼을 눌러 주세요.";
    return;
  }
  recoveryAttempts = attempt;
  runtimeState = "reconnecting";
  lastErrorCode = "connection_unavailable";
  lastError = detail
    ? `Discord 음성 연결을 자동으로 재연결하는 중입니다 (${attempt}/5). 원인: ${detail}`
    : `Discord 음성 연결을 자동으로 재연결하는 중입니다 (${attempt}/5).`;
  const recoveringConnection = connection;
  const generation = queueGeneration;
  recoveryTimer = setTimeout(async () => {
    recoveryTimer = undefined;
    if (connection !== recoveringConnection || !started || generation !== queueGeneration) return;
    if (recoveringConnection.state.status === VoiceConnectionStatus.Ready) return;
    try {
      if (!connection.rejoin()) throw new Error("Discord voice rejoin was rejected");
      await entersState(recoveringConnection, VoiceConnectionStatus.Ready, 10_000);
    } catch (recoveryError) {
      if (connection === recoveringConnection && generation === queueGeneration) scheduleVoiceRecovery(recoveryError);
    }
  }, Math.min(1_000 * 2 ** (attempt - 1), 16_000));
}

async function playPcm(pcm: Buffer) {
  if (!connection) throw new Error("Discord voice connection is not ready");
  const generation = queueGeneration;
  const readyConnection = connection;
  const audio = await encodeDiscordOpus(pcm);
  if (generation !== queueGeneration) throw new Error("Discord playback was stopped");
  await entersState(readyConnection, VoiceConnectionStatus.Ready, 10_000);
  if (generation !== queueGeneration || readyConnection !== connection) throw new Error("Discord connection changed before playback");
  const { resource, diagnostics } = createBufferedOpusResource(audio);
  playback = diagnostics;
  const onConnectionState = (_old: unknown, next: { status: string }) => {
    if (next.status !== VoiceConnectionStatus.Ready) diagnostics.connectionInterruptions += 1;
  };
  readyConnection.on("stateChange", onConnectionState);
  const begin = performance.now();
  try {
    player.play(resource);
    await entersState(player, AudioPlayerStatus.Playing, 10_000);
    await entersState(player, AudioPlayerStatus.Idle, 120_000);
    if (generation !== queueGeneration) throw new Error("Discord playback was stopped");
  } finally {
    diagnostics.wallPlaybackMs = Math.round(performance.now() - begin);
    readyConnection.off("stateChange", onConnectionState);
    if (player.state.status !== AudioPlayerStatus.Idle) player.stop(true);
    console.info("[discord-tts] playback metrics", JSON.stringify({ instanceId, ...diagnostics }));
  }
}

async function processQueue() {
  if (processing) return;
  processing = true;
  const generation = queueGeneration;
  try {
    // Each queue item is one sentence: synthesize, convert, and play it before
    // advancing. This preserves spoken order and prevents a long Discord
    // message from being sent to the TTS provider as one oversized request.
    while (queue.length && runtimeState === "connected" && generation === queueGeneration) {
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
        if (generation !== queueGeneration) break;
        stage = "voice_playback";
        await playPcm(pcm);
        item.status = "completed";
        lastError = null;
        lastErrorCode = null;
        addHistory(item);
      } catch (error) {
        if (generation === queueGeneration) markError(item, stage, error);
      } finally {
        currentText = null;
      }
    }
  } finally {
    processing = false;
    if (queue.length && runtimeState === "connected") void processQueue();
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

export function queueDiscordTtsTest(text: string) {
  if (runtimeState !== "connected" || !connection) throw new Error("Discord 봇이 연결된 후 송출 테스트를 실행해 주세요.");
  enqueueText(text);
  return { message: "Discord 송출 테스트를 대기열에 추가했습니다. 재생 후 아래 진단 수치를 확인해 주세요." };
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

async function retireDiscordClient() {
  const retiredClient = client;
  try {
    // destroy() is terminal: a later attempt gets fresh guild/shard adapters,
    // even if the previous client never reached Ready or has already failed.
    await retiredClient.destroy();
  } finally {
    retiredClient.removeAllListeners();
    if (client === retiredClient) {
      client = createDiscordClient();
      listenersInstalled = false;
    }
  }
}

function installListeners() {
  if (!playerListenerInstalled) {
    playerListenerInstalled = true;
    player.on("error", error => {
      lastErrorCode = "voice_playback_failed";
      lastError = `Discord 오디오 player 오류: ${error.message.slice(0, 220)}`;
    });
  }
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

async function startDiscordTtsBotInternal() {
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
  const generation = queueGeneration;
  let stage = "login";
  connectionStage = stage;
  try {
    await client.login(token);
    if (generation !== queueGeneration) return getDiscordBotStatus();
    stage = "gateway readiness";
    connectionStage = stage;
    // login() establishes the WebSocket, but voiceAdapterCreator only sends
    // packets once the guild's shard is Ready. Do not race this event.
    if (!client.isReady()) await once(client, Events.ClientReady, { signal: AbortSignal.timeout(20_000) });
    if (generation !== queueGeneration) return getDiscordBotStatus();
    stage = "guild lookup";
    connectionStage = stage;
    const guild = await client.guilds.fetch(config.guildId);
    stage = "text channel lookup";
    connectionStage = stage;
    const textChannel = await guild.channels.fetch(config.textChannelId);
    if (!textChannel?.isTextBased()) throw new Error(`Configured text channel ${config.textChannelId} was not found or is not text-based`);
    stage = "voice channel lookup";
    connectionStage = stage;
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
    if (generation !== queueGeneration) return getDiscordBotStatus();
    stage = "voice connection";
    connectionStage = stage;
    connection = joinVoiceChannel({ channelId: channel.id, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator, selfDeaf: false });
    recordVoiceSnapshot(connection.state);
    // Discord voice can emit networking errors during IP discovery, before the
    // connection reaches Ready. Register handlers immediately so a closed UDP
    // discovery socket never becomes an unhandled EventEmitter error.
    connection.on("stateChange", (_oldState, newState) => {
      recordVoiceSnapshot(newState);
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        scheduleVoiceRecovery(new Error("Discord voice connection disconnected"));
      } else if (newState.status === VoiceConnectionStatus.Ready) {
        if (recoveryTimer) clearTimeout(recoveryTimer);
        recoveryTimer = undefined;
        recoveryAttempts = 0;
        if (runtimeState !== "paused") runtimeState = "connected";
        lastError = null;
        lastErrorCode = null;
        if (runtimeState === "connected") void processQueue();
      } else if (runtimeState === "connected") {
        runtimeState = "reconnecting";
      }
    });
    connection.on("error", (error) => {
      scheduleVoiceRecovery(error);
    });
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    if (generation !== queueGeneration) return getDiscordBotStatus();
    connection.subscribe(player);
    runtimeState = "connected";
    lastError = null;
    lastErrorCode = null;
    startupRetryAttempts = 0;
    connectionStage = "ready";
  } catch (error) {
    if (generation !== queueGeneration) return getDiscordBotStatus();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const wasAborted = /aborted/i.test(errorMessage);
    const timeoutDetail = stage === "voice connection" && wasAborted ? voiceTimeoutMessage(connection?.state) : null;
    if (connection) recordVoiceSnapshot(connection.state);
    const failureSnapshot = voiceSnapshot;
    started = false;
    connection?.destroy();
    connection = undefined;
    // Keep the pre-destroy phase rather than replacing it with "destroyed".
    voiceSnapshot = failureSnapshot;
    await retireDiscordClient();
    if (generation !== queueGeneration) return getDiscordBotStatus();
    runtimeState = "error";
    const detail = (timeoutDetail ?? errorMessage).replace(/\s+/g, " ").slice(0, 300);
    const networkHint = /IP discovery|socket closed|UDP/i.test(detail)
      ? " 현재 WebDev 웹 런타임의 UDP 제한일 수 있어 Discord 봇을 고정 공인 IP의 persistent worker로 분리해야 할 수 있습니다."
      : "";
    const abortHint = wasAborted
      ? " 연결 준비 대기가 시간 초과되었거나 연결이 중단되었습니다. 이 메시지만으로 HTTP 요청 취소나 UDP 제한을 확정할 수는 없습니다."
      : "";
    const baseError = stage === "voice connection"
      ? `Discord 음성 채널에 연결하지 못했습니다. 봇 연결과 음성 권한을 확인한 뒤 재시도해 주세요.${detail ? ` 원인: ${detail}` : ""}${networkHint}${abortHint}`
      : stage === "text channel lookup" || stage === "voice channel lookup" || stage === "guild lookup"
        ? `Discord 서버 또는 채널 설정을 확인해 주세요. 서버·Text 채널·음성 채널 ID가 올바른지 확인해야 합니다.${detail ? ` 원인: ${detail}` : ""}`
        : `Discord ${stage} failed: ${detail}`;
    lastError = baseError;
    lastErrorCode = stage === "voice connection"
      ? "connection_unavailable"
      : stage === "text channel lookup" || stage === "voice channel lookup" || stage === "guild lookup"
        ? "configuration_invalid"
        : "unknown";
    if (wasAborted && startupRetryAttempts < 3) {
      startupRetryAttempts += 1;
      runtimeState = "starting";
      lastError = `${baseError} 자동 연결 재시도 중입니다 (${startupRetryAttempts}/3).`;
      if (startupRetryTimer) clearTimeout(startupRetryTimer);
      startupRetryTimer = setTimeout(() => {
        startupRetryTimer = undefined;
        void startDiscordTtsBot().catch((retryError) => console.error("[discord-tts] automatic startup retry failed", retryError));
      }, 1_500 * startupRetryAttempts);
    }
  }
  return getDiscordBotStatus();
}

export function startDiscordTtsBot() {
  if (startupPromise) return startupPromise;
  startupPromise = startDiscordTtsBotInternal();
  void startupPromise.then(
    () => { startupPromise = undefined; },
    () => { startupPromise = undefined; },
  );
  return startupPromise;
}

export async function stopDiscordTtsBot() {
  queueGeneration += 1;
  player.stop(true);
  queue.length = 0;
  currentText = null;
  if (recoveryTimer) clearTimeout(recoveryTimer);
  if (startupRetryTimer) clearTimeout(startupRetryTimer);
  recoveryTimer = undefined;
  startupRetryTimer = undefined;
  recoveryAttempts = 0;
  startupRetryAttempts = 0;
  connection?.destroy();
  connection = undefined;
  await retireDiscordClient();
  started = false;
  runtimeState = "stopped";
  connectionStage = "stopped";
  return getDiscordBotStatus();
}

export function pauseDiscordTtsBot() {
  if (runtimeState === "connected" || runtimeState === "starting") runtimeState = "paused";
  return getDiscordBotStatus();
}

export function getDiscordBotStatus(): BotStatus & { tts: ReturnType<typeof getDiscordTtsStatus>; settings: DiscordTtsSettings } {
  if (connection) recordVoiceSnapshot(connection.state);
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
    instanceId,
    playback: playback ? { ...playback } : null,
    voicePing: { ws: connection?.ping.ws ?? null, udp: connection?.ping.udp ?? null },
    connectionDiagnostics: { stage: connectionStage, ...voiceSnapshot, startupRetryAttempts, transitions: voiceTransitions.map(item => ({ ...item })) },
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
