import type { Express } from "express";
import { completeGooglePhotosAuthorization } from "./googlePhotos";
import { createContext } from "./_core/context";

function callbackLocation(status: "connected" | "error", reason?: string) {
  const params = new URLSearchParams({ tab: "gallery", googlePhotos: status });
  if (reason) params.set("reason", reason.slice(0, 180));
  return `/admin?${params.toString()}`;
}

/** OAuth callbacks require an Express route; all app operations remain admin-only tRPC procedures. */
export function registerGooglePhotosRoutes(app: Express) {
  app.get("/api/google-photos/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const providerError = typeof req.query.error === "string" ? req.query.error : null;
    if (providerError || !code || !state) {
      res.redirect(callbackLocation("error", providerError ?? "Google Photos authorization was cancelled"));
      return;
    }
    try {
      const context = await createContext({ req, res, info: {} as never });
      if (!context.user || context.user.role !== "admin") throw new Error("Sign in with an administrator account before connecting Google Photos");
      await completeGooglePhotosAuthorization(code, state, context.user.id);
      res.redirect(callbackLocation("connected"));
    } catch (error) {
      console.warn("[Google Photos] OAuth callback failed", error instanceof Error ? error.message : "Unknown error");
      res.redirect(callbackLocation("error", error instanceof Error ? error.message : "Unable to connect Google Photos"));
    }
  });
}
