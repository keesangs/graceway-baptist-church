import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  deleteMeditationComment,
  deleteMediaFile,
  deleteDailyMeditation,
  getCalendarEventById,
  getDailyMeditationById,
  getDailyMeditationByDate,
  getMeditationCommentById,
  getUserMeditationLike,
  getLatestPublishedWeeklyNewsletterIssue,
  getWeeklyNewsletterIssueById,
  getWeeklyNewsletterSyncSettings,
  insertContactMessage,
  insertDailyMeditation,
  insertMeditationComment,
  insertMediaFile,
  listContactMessages,
  listCalendarEvents,
  listDailyMeditations,
  listMeditationComments,
  listMediaFiles,
  listNewsletterSubscribers,
  listPublishedCalendarEvents,
  listPublishedWeeklyNewsletterIssues,
  listWeeklyNewsletterIssuesForAdmin,
  listYouTubeVideos,
  saveYouTubePlaylistVideos,
  subscribeToNewsletter,
  toggleMeditationCommentLike,
  toggleMeditationLike,
  updateCalendarEvent,
  updateDailyMeditation,
  updateWeeklyNewsletterIssue,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { fetchPlaylistVideos } from "./youtube";
import { expandCalendarEventOccurrences, getFeaturedSpecialCalendarEventOccurrence, getUpcomingCalendarEventOccurrences } from "./eventOccurrences";
import { syncPublicWeeklyNewsletterArchive } from "./weeklyNewsletterSync";


/** Human-readable labels for the Connect-form topic values, used in staff alerts. */
const TOPIC_LABELS = {
  visit: "Plan a visit",
  prayer: "Prayer request",
  ministry: "Ministry involvement",
  general: "General question",
} as const;

const calendarEventValues = {
  titleKo: z.string().trim().min(1).max(255),
  titleEn: z.string().trim().max(255).nullable().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().nullable().optional(),
  allDay: z.boolean().default(false),
  venueKo: z.string().trim().max(255).nullable().optional(),
  venueEn: z.string().trim().max(255).nullable().optional(),
  descriptionKo: z.string().trim().max(8000).nullable().optional(),
  descriptionEn: z.string().trim().max(8000).nullable().optional(),
  eventType: z.enum(["worship", "prayer", "fellowship", "ministry", "special", "other"]).default("other"),
  status: z.enum(["draft", "published", "cancelled"]).default("draft"),
  recurrence: z.enum(["none", "weekly"]).default("none"),
  recurrenceUntil: z.coerce.date().nullable().optional(),
};

const weeklyNewsletterStatus = z.enum(["draft", "published", "hidden"]);
const weeklyNewsletterUpdateInput = z.object({
  id: z.number().int().positive(),
  titleKo: z.string().trim().min(1).max(255).optional(),
  titleEn: z.string().trim().max(255).nullable().optional(),
  status: weeklyNewsletterStatus.optional(),
});

const calendarEventCreateInput = z.object(calendarEventValues).superRefine((input, ctx) => {
  if (input.endAt && input.endAt < input.startAt) {
    ctx.addIssue({ code: "custom", path: ["endAt"], message: "End time must be after start time" });
  }
  if (input.recurrenceUntil && input.recurrenceUntil < input.startAt) {
    ctx.addIssue({ code: "custom", path: ["recurrenceUntil"], message: "Recurrence end must be on or after the first event" });
  }
  if (input.recurrence === "none" && input.recurrenceUntil) {
    ctx.addIssue({ code: "custom", path: ["recurrenceUntil"], message: "A recurrence end requires a weekly event" });
  }
});

const nullableText = (value: string | null | undefined) => value?.trim() || null;

function mapCalendarEventInput(input: z.infer<typeof calendarEventCreateInput>) {
  return {
    titleKo: input.titleKo,
    titleEn: nullableText(input.titleEn),
    startAt: input.startAt,
    endAt: input.endAt ?? null,
    allDay: input.allDay ? 1 : 0,
    venueKo: nullableText(input.venueKo),
    venueEn: nullableText(input.venueEn),
    descriptionKo: nullableText(input.descriptionKo),
    descriptionEn: nullableText(input.descriptionEn),
    eventType: input.eventType,
    status: input.status,
    recurrence: input.recurrence,
    recurrenceUntil: input.recurrence === "weekly" ? input.recurrenceUntil ?? null : null,
  } as const;
}

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

  // ── YouTube Playlist Sync ─────────────────────────────────────────────────
  youtube: router({
    /** Public pages read the persisted records, never the server-side API key. */
    list: publicProcedure
      .input(z.object({ videoKind: z.enum(["sermon", "worship"]) }))
      .query(({ input }) => listYouTubeVideos(input.videoKind)),

    /** Church staff manually pulls new playlist videos on demand. */
    sync: adminProcedure.mutation(async () => {
      const [sermonVideos, worshipVideos] = await Promise.all([
        fetchPlaylistVideos("sermon"),
        fetchPlaylistVideos("worship"),
      ]);

      const [sermons, worship] = await Promise.all([
        saveYouTubePlaylistVideos(sermonVideos),
        saveYouTubePlaylistVideos(worshipVideos),
      ]);

      return { sermons, worship };
    }),
  }),

  // ── Church Calendar Events ────────────────────────────────────────────────
  events: router({
    /** Published event occurrences for a visible public calendar interval. */
    listRange: publicProcedure
      .input(z.object({ start: z.coerce.date(), end: z.coerce.date() }))
      .query(async ({ input }) => {
        if (input.end <= input.start) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Calendar end must be after start" });
        }
        const events = await listPublishedCalendarEvents();
        return expandCalendarEventOccurrences(events, input.start, input.end);
      }),

    /** Home page source: the six soonest published occurrences, including weekly series. */
    upcoming: publicProcedure.query(async () => {
      const events = await listPublishedCalendarEvents();
      return getUpcomingCalendarEventOccurrences(events, new Date(), 6);
    }),

    /** The nearest public event intentionally marked as special for the calendar feature. */
    featuredSpecial: publicProcedure.query(async () => {
      const events = await listPublishedCalendarEvents();
      return getFeaturedSpecialCalendarEventOccurrence(events, new Date());
    }),

    /** Full source list is restricted to administrators so drafts and cancellations remain private. */
    listAdmin: adminProcedure.query(() => listCalendarEvents()),

    create: adminProcedure.input(calendarEventCreateInput).mutation(({ input, ctx }) => {
      return createCalendarEvent({ ...mapCalendarEventInput(input), createdBy: ctx.user.id });
    }),

    update: adminProcedure
      .input(z.object({ id: z.number().int().positive(), event: calendarEventCreateInput }))
      .mutation(async ({ input }) => {
        const existing = await getCalendarEventById(input.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        return updateCalendarEvent(input.id, mapCalendarEventInput(input.event));
      }),

    /** Use status=cancelled for operational cancellation; deletion is for accidental entries only. */
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const existing = await getCalendarEventById(input.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        await deleteCalendarEvent(input.id);
        return { success: true } as const;
      }),
  }),

  // ── Weekly Newsletter PDFs ───────────────────────────────────────────────
  weeklyNewsletter: router({
    /** The latest public bulletin for the Events page. */
    latest: publicProcedure.query(() => getLatestPublishedWeeklyNewsletterIssue()),

    /** Public bulletin archive, capped to protect response size while supporting year/month browsing. */
    list: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(12) }))
      .query(({ input }) => listPublishedWeeklyNewsletterIssues(input.limit)),

    /** Administrators can inspect drafts, hidden records, and sync diagnostics. */
    listAdmin: adminProcedure.query(() => listWeeklyNewsletterIssuesForAdmin()),
    syncStatus: adminProcedure.query(() => getWeeklyNewsletterSyncSettings()),

    /** On-demand fallback for the Sunday background sync. */
    syncNow: adminProcedure.mutation(() => syncPublicWeeklyNewsletterArchive()),

    update: adminProcedure.input(weeklyNewsletterUpdateInput).mutation(async ({ input }) => {
      const issue = await getWeeklyNewsletterIssueById(input.id);
      if (!issue) throw new TRPCError({ code: "NOT_FOUND", message: "Weekly newsletter not found" });

      const nextStatus = input.status ?? issue.status;
      return updateWeeklyNewsletterIssue(input.id, {
        titleKo: input.titleKo,
        titleEn: input.titleEn === undefined ? undefined : input.titleEn?.trim() || null,
        status: nextStatus,
        publishedAt: nextStatus === "published" && issue.status !== "published" ? new Date() : issue.publishedAt,
      });
    }),
  }),

  // ── Newsletter ─────────────────────────────────────────────────────
  newsletter: router({
    /**
     * Public signup from the Home page form. Idempotent by email, so a repeat
     * submission is treated as success instead of a duplicate-key error.
     */
    subscribe: publicProcedure
      .input(
        z.object({
          // Trim before validating: mobile keyboards and autofill routinely append
          // a trailing space, which would otherwise fail the email format check.
          email: z.string().trim().toLowerCase().pipe(z.string().email().max(320)),
          lang: z.enum(["en", "ko"]).default("en"),
        }),
      )
      .mutation(async ({ input }) => {
        const row = await subscribeToNewsletter({
          email: input.email,
          lang: input.lang,
        });
        return { success: true, email: row?.email ?? input.email } as const;
      }),

    /** Church staff view of the subscriber list. */
    list: adminProcedure.query(() => listNewsletterSubscribers()),
  }),

  // ── Contact form ───────────────────────────────────────────────
  contact: router({
    /** Public submission from the Connect page form. */
    submit: publicProcedure
      .input(
        z.object({
          firstName: z.string().trim().min(1).max(100),
          lastName: z.string().trim().min(1).max(100),
          // Trim/lowercase before format validation — see newsletter.subscribe.
          email: z.string().trim().toLowerCase().pipe(z.string().email().max(320)),
          phone: z.string().max(40).optional(),
          topic: z.enum(["visit", "prayer", "ministry", "general"]).default("general"),
          message: z.string().max(4000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const phone = input.phone?.trim() || null;
        const message = input.message?.trim() || null;

        await insertContactMessage({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone,
          topic: input.topic,
          message,
        });

        // Alert church staff so an enquiry is not left sitting unread in the
        // database. The visitor's submission is already saved at this point, so a
        // notification outage must never turn into a failed form submission.
        try {
          const notified = await notifyOwner({
            title: `New ${TOPIC_LABELS[input.topic]} enquiry from ${input.firstName} ${input.lastName}`,
            content: [
              `Name: ${input.firstName} ${input.lastName}`,
              `Email: ${input.email}`,
              `Phone: ${phone ?? "—"}`,
              `Topic: ${TOPIC_LABELS[input.topic]}`,
              "",
              message ?? "(no message provided)",
            ].join("\n"),
          });
          if (!notified) {
            // The notification service accepted the request but returned a
            // non-success response. The enquiry is already persisted, so we
            // log the outage for ops visibility without failing the visitor.
            console.warn(
              "[contact.submit] Notification service returned false — staff alert was not delivered.",
            );
          }
        } catch (error) {
          console.warn("[contact.submit] Owner notification failed:", error);
        }

        return { success: true } as const;
      }),

    /** Church staff inbox. */
    list: adminProcedure.query(() => listContactMessages()),
  }),

  // Daily Bible Meditations
  meditation: router({
    today: publicProcedure
      .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(({ input }) => getDailyMeditationByDate(input.date)),

    list: publicProcedure
      .input(
        z.object({
          limit: z.number().int().positive().max(100).default(30),
          offset: z.number().int().nonnegative().default(0),
        }),
      )
      .query(({ input }) => listDailyMeditations(input.limit, input.offset)),

    create: adminProcedure
      .input(
        z.object({
          meditationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          scriptureReference: z.string().min(1).max(255),
          scriptureReferenceEn: z.string().max(255).optional(),
          scriptureText: z.string().min(1),
          scriptureTextEn: z.string().optional(),
          title: z.string().min(1).max(255),
          titleEn: z.string().max(255).optional(),
          content: z.string().min(1),
          contentEn: z.string().optional(),
        }),
      )
      .mutation(({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        return insertDailyMeditation({
          meditationDate: input.meditationDate,
          scriptureReference: input.scriptureReference,
          scriptureReferenceEn: input.scriptureReferenceEn?.trim() || null,
          scriptureText: input.scriptureText,
          scriptureTextEn: input.scriptureTextEn?.trim() || null,
          title: input.title,
          titleEn: input.titleEn?.trim() || null,
          content: input.content,
          contentEn: input.contentEn?.trim() || null,
          authorId: ctx.user.id,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          meditationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          scriptureReference: z.string().min(1).max(255).optional(),
          scriptureReferenceEn: z.string().max(255).nullable().optional(),
          scriptureText: z.string().min(1).optional(),
          scriptureTextEn: z.string().nullable().optional(),
          title: z.string().min(1).max(255).optional(),
          titleEn: z.string().max(255).nullable().optional(),
          content: z.string().min(1).optional(),
          contentEn: z.string().nullable().optional(),
        }),
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateDailyMeditation(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        deleteDailyMeditation(input.id);
        return { success: true } as const;
      }),

    likeStatus: publicProcedure
      .input(z.object({ meditationId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const meditation = await getDailyMeditationById(input.meditationId);
        if (!meditation) throw new TRPCError({ code: "NOT_FOUND", message: "Meditation not found" });
        const hasLiked = ctx.user
          ? Boolean(await getUserMeditationLike(input.meditationId, ctx.user.id))
          : false;
        return { likeCount: meditation.likeCount, hasLiked };
      }),

    toggleLike: protectedProcedure
      .input(z.object({ meditationId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const meditation = await getDailyMeditationById(input.meditationId);
        if (!meditation) throw new TRPCError({ code: "NOT_FOUND", message: "Meditation not found" });
        const liked = await toggleMeditationLike(input.meditationId, ctx.user.id);
        return { liked } as const;
      }),

    comments: router({
      /** Anyone can read the conversation attached to a published meditation. */
      list: publicProcedure
        .input(
          z.object({
            meditationId: z.number().int().positive(),
            limit: z.number().int().positive().max(25).default(10),
            offset: z.number().int().nonnegative().default(0),
          }),
        )
        .query(({ input, ctx }) => listMeditationComments(input.meditationId, ctx.user?.id, input.limit, input.offset)),

      /** A signed-in member can share one short reflection per submission. */
      create: protectedProcedure
        .input(
          z.object({
            meditationId: z.number().int().positive(),
            parentCommentId: z.number().int().positive().optional(),
            content: z.string().trim().min(1).max(1200),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          const meditation = await getDailyMeditationById(input.meditationId);
          if (!meditation) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Meditation not found" });
          }

          if (input.parentCommentId) {
            const parent = await getMeditationCommentById(input.parentCommentId);
            if (!parent || parent.meditationId !== input.meditationId) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Reply target is invalid" });
            }
            if (parent.parentCommentId !== null) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Replies may only be one level deep" });
            }
          }

          await insertMeditationComment({
            meditationId: input.meditationId,
            parentCommentId: input.parentCommentId ?? null,
            authorId: ctx.user.id,
            content: input.content,
          });

          return { success: true } as const;
        }),

      /** A member may remove their own comment; church administrators may moderate any comment. */
      delete: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const comment = await getMeditationCommentById(input.id);
          if (!comment) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
          }
          if (comment.authorId !== ctx.user.id && ctx.user.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "You may only delete your own comment" });
          }

          await deleteMeditationComment(input.id);
          return { success: true } as const;
        }),

      /** Toggle a member's single appreciation reaction on a comment or reply. */
      toggleLike: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const comment = await getMeditationCommentById(input.id);
          if (!comment) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
          }

          const liked = await toggleMeditationCommentLike(input.id, ctx.user.id);
          return { liked } as const;
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
