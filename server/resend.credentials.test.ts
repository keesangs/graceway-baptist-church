import { describe, expect, it } from "vitest";

const RESEND_API_URL = "https://api.resend.com/domains";
const GRACEWAY_DOMAIN = "graceway-baptist.org";

describe("Resend production credentials", () => {
  it("authorizes a read-only domain lookup for the verified church sender", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toMatch(/^re_/);

    const response = await fetch(RESEND_API_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    // Do not include any response body, credential, or operational metadata in
    // test output. A generic assertion keeps the production secret private.
    expect(response.ok).toBe(true);

    const payload = (await response.json()) as {
      data?: Array<{ name?: string; status?: string }>;
    };
    const domain = payload.data?.find((entry) => entry.name === GRACEWAY_DOMAIN);

    expect(domain?.status).toBe("verified");
  }, 15_000);
});
