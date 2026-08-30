import { describe, expect, it } from "vitest";

describe("Google Photos OAuth configuration", () => {
  it("accepts the configured client credentials without exposing their values", async () => {
    const clientId = process.env.GOOGLE_PHOTOS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_PHOTOS_CLIENT_SECRET;

    expect(clientId, "GOOGLE_PHOTOS_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "GOOGLE_PHOTOS_CLIENT_SECRET must be configured").toBeTruthy();

    // A deliberately unusable code lets Google validate the client credentials
    // without creating a token or logging any secret. Valid client credentials
    // reach the authorization-code validation stage and return invalid_grant.
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: "graceway-configuration-validation-only",
        grant_type: "authorization_code",
        redirect_uri: "https://graceway-baptist.org/api/google-photos/callback",
      }),
    });
    const payload = await response.json() as { error?: string };

    expect(payload.error).not.toBe("invalid_client");
    expect(payload.error).not.toBe("unauthorized_client");
    expect(response.status).toBe(400);
    expect(payload.error).toBe("invalid_grant");
  }, 15_000);
});
