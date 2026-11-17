import { enqueueDiscordTtsSmokeMessages, startDiscordTtsBot, stopDiscordTtsBot } from "../server/discordBot";

const messages = [
  "Welcome to Graceway Baptist Church.",
  "Please prepare your hearts for worship.",
  "Thank you for joining us today.",
  "We will begin in just a moment.",
  "May God's peace be with you.",
];

const startedAt = performance.now();
const status = await startDiscordTtsBot();
if (status.state !== "connected") {
  console.error(JSON.stringify({ ok: false, phase: "connect", state: status.state, lastError: status.lastError }, null, 2));
  process.exitCode = 1;
} else {
  try {
    const history = await enqueueDiscordTtsSmokeMessages(messages);
    const passed = history.length === messages.length && history.every(item => item.status === "completed" && item.engine === "deepinfra-qwen");
    console.log(JSON.stringify({
      ok: passed,
      phase: "playback",
      messages: history.map(item => ({ status: item.status, engine: item.engine, latencyMs: item.latencyMs, error: item.error })),
      elapsedMs: Math.round(performance.now() - startedAt),
    }, null, 2));
    if (!passed) process.exitCode = 1;
  } finally {
    await stopDiscordTtsBot();
  }
}
