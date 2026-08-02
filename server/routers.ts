import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { deleteMediaFile, insertMediaFile, listMediaFiles } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Media Library ─────────────────────────────────────────────────────────
  media: router({
    /**
     * List all media files, optionally filtered by category.
     * Public so the church website can display uploaded images/sermons.
     */
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(({ input }) => listMediaFiles(input.category)),

    /**
     * Upload a file to S3 storage and record metadata in the database.
     * Accepts base64-encoded file data from the frontend.
     * Requires authentication (any logged-in user).
     */
    upload: protectedProcedure
      .input(
        z.object({
          filename: z.string().min(1).max(255),
          mimeType: z.string().min(1).max(128),
          fileSize: z.number().int().positive(),
          category: z.enum(["sermon", "image", "document", "other"]),
          description: z.string().max(500).optional(),
          /** Base64-encoded file content */
          data: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        // Validate file size (max 50 MB)
        if (input.fileSize > 50 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size exceeds 50 MB limit",
          });
        }

        // Decode base64 → Buffer
        const buffer = Buffer.from(input.data, "base64");

        // Build a clean storage key: category/filename
        const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const relKey = `church-media/${input.category}/${safeFilename}`;

        // Upload to S3
        const { key, url } = await storagePut(relKey, buffer, input.mimeType);

        // Persist metadata
        await insertMediaFile({
          filename: input.filename,
          fileKey: key,
          url,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          category: input.category,
          description: input.description ?? null,
          uploadedBy: ctx.user.id,
        });

        return { key, url };
      }),

    /**
     * Delete a media file record.
     * Admin-only operation.
     */
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteMediaFile(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
