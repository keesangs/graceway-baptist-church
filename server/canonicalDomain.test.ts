import { describe, expect, it } from "vitest";
import { canonicalPublicUrlForBrowser } from "../client/src/lib/canonicalPublicDomain";
import { CANONICAL_PUBLIC_ORIGIN, canonicalPublicUrlForHost, originalPublicHostname } from "./canonicalDomain";

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

  it("uses the original proxy host when the managed deployment proxy replaces the request hostname", () => {
    expect(
      originalPublicHostname({
        hostname: "internal.manus.service",
        get: header => (header === "x-forwarded-host" ? "graceway-baptist.manus.space" : undefined),
      }),
    ).toBe("graceway-baptist.manus.space");

    expect(
      originalPublicHostname({
        hostname: "graceway-baptist.org",
        get: () => undefined,
      }),
    ).toBe("graceway-baptist.org");
  });

  it("uses the same canonical origin in the browser when the transparent proxy serves an alias directly", () => {
    expect(
      canonicalPublicUrlForBrowser({
        hostname: "graceway-baptist.manus.space",
        pathname: "/events",
        search: "?month=2026-09",
        hash: "#calendar",
      }),
    ).toBe(`${CANONICAL_PUBLIC_ORIGIN}/events?month=2026-09#calendar`);

    expect(
      canonicalPublicUrlForBrowser({
        hostname: "graceway-baptist.org",
        pathname: "/",
        search: "",
        hash: "",
      }),
    ).toBeNull();
  });
});
