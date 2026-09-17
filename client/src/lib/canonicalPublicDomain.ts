export const CANONICAL_PUBLIC_ORIGIN = "https://graceway-baptist.org";

const MANUS_PUBLIC_ALIASES = new Set([
  "graceway-baptist.manus.space",
  "gracewaybc-skghmy3b.manus.space",
]);

export function canonicalPublicUrlForBrowser(location: Pick<Location, "hostname" | "pathname" | "search" | "hash">) {
  const hostname = location.hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!MANUS_PUBLIC_ALIASES.has(hostname)) return null;

  return `${CANONICAL_PUBLIC_ORIGIN}${location.pathname}${location.search}${location.hash}`;
}
