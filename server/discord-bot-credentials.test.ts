import { describe, expect, it } from "vitest";

describe("Discord bot credentials", () => {
  it("authenticates against Discord users/@me without exposing the token", async () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    expect(token, "DISCORD_BOT_TOKEN must be configured as a server secret").toBeTruthy();

    const response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${token}`, Accept: "application/json" },
    });
    const payload = (await response.json()) as { id?: string; username?: string; message?: string };

    expect(response.status, payload.message ?? "Discord bot authentication failed").toBe(200);
    expect(payload.id).toMatch(/^\d+$/);
    expect(payload.username).toBeTruthy();
  }, 30_000);
});
