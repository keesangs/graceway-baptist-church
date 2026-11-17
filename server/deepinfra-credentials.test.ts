import { describe, expect, it } from "vitest";

const DEEPINFRA_MODELS_URL = "https://api.deepinfra.com/v1/models";

describe("DeepInfra credentials", () => {
  it("authenticates against the lightweight models endpoint without exposing the key", async () => {
    const apiKey = process.env.DEEPINFRA_API_KEY;
    expect(apiKey, "DEEPINFRA_API_KEY must be configured as a server secret").toBeTruthy();

    const response = await fetch(DEEPINFRA_MODELS_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    expect(response.status, await response.text()).toBe(200);
    expect(response.headers.get("content-type") ?? "").toContain("application/json");
  }, 30_000);
});
