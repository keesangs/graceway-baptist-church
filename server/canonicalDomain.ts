import type { Express, Request, Response } from "express";

export const CANONICAL_PUBLIC_ORIGIN = "https://graceway-baptist.org";

const MANUS_PREVIEW_HOSTS = new Set([
  "graceway-baptist.manus.space",
  "gracewaybc-skghmy3b.manus.space",
]);

export function canonicalPublicUrlForHost(hostname: string | undefined, originalUrl: string) {
  const normalizedHost = hostname?.trim().toLowerCase().replace(/\.$/, "");
  if (!normalizedHost || !MANUS_PREVIEW_HOSTS.has(normalizedHost)) return null;

  const pathAndQuery = originalUrl.startsWith("/") ? originalUrl : `/${originalUrl}`;
  return `${CANONICAL_PUBLIC_ORIGIN}${pathAndQuery}`;
}

/**
 * Preserve one public address for shared links and search indexing. This only
 * affects browser GET/HEAD requests to project-owned Manus public aliases; the
 * preview and API hosts remain available to development and integrations.
 */
export function registerCanonicalPublicDomainRedirect(app: Express) {
  app.use((req: Request, res: Response, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();

    const canonicalUrl = canonicalPublicUrlForHost(req.hostname, req.originalUrl);
    if (!canonicalUrl) return next();

    return res.redirect(308, canonicalUrl);
  });
}
