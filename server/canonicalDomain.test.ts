import { describe, expect, it } from "vitest";
import { CANONICAL_PUBLIC_ORIGIN, canonicalPublicUrlForHost } from "./canonicalDomain";

describe("canonical public domain", () => {
  it("redirects project-owned Manus public aliases to the HTTPS apex domain while preserving the path and query", () => {
    expect(canonicalPublicUrlForHost("graceway-baptist.manus.space", "/events?month=2026-09")).toBe(
      `${CANONICAL_PUBLIC_ORIGIN}/events?month=2026-09`,
    );
    expect(canonicalPublicUrlForHost("gracewaybc-skghmy3b.manus.space", "/sermons")).toBe(
      `${CANONICAL_PUBLIC_ORIGIN}/sermons`,
    );
  });

  it("does not redirect the custom apex, www, development hosts, or unknown hosts", () => {
    expect(canonicalPublicUrlForHost("graceway-baptist.org", "/")).toBeNull();
    expect(canonicalPublicUrlForHost("www.graceway-baptist.org", "/")).toBeNull();
    expect(canonicalPublicUrlForHost("3000-preview.manus.computer", "/")).toBeNull();
    expect(canonicalPublicUrlForHost("example.test", "/")).toBeNull();
  });
});
