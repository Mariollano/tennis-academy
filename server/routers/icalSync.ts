import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { icalSyncSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { syncIcalCalendar } from "../icalSync";

export const icalSyncRouter = router({
  /** Get current iCal sync settings and status */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const rows = await db.select().from(icalSyncSettings).limit(1);
    if (!rows.length) return null;
    return rows[0];
  }),

  /** Save (upsert) the iCal URL */
  saveSettings: protectedProcedure
    .input(z.object({ icalUrl: z.string().min(1), isEnabled: z.boolean().default(true) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Normalize webcal:// and webcals:// to https:// so fetch() can handle them
      let icalUrl = input.icalUrl.trim();
      if (icalUrl.startsWith("webcal://")) {
        icalUrl = "https://" + icalUrl.slice("webcal://".length);
      } else if (icalUrl.startsWith("webcals://")) {
        icalUrl = "https://" + icalUrl.slice("webcals://".length);
      }

      const existing = await db.select().from(icalSyncSettings).limit(1);
      if (existing.length) {
        await db.update(icalSyncSettings)
          .set({ icalUrl, isEnabled: input.isEnabled })
          .where(eq(icalSyncSettings.id, existing[0].id));
      } else {
        await db.insert(icalSyncSettings).values({
          icalUrl,
          isEnabled: input.isEnabled,
        });
      }
      return { success: true };
    }),

  /** Manually trigger a sync now */
  syncNow: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const result = await syncIcalCalendar();
    return result;
  }),

  /** Enable or disable the sync without changing the URL */
  toggleEnabled: protectedProcedure
    .input(z.object({ isEnabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const existing = await db.select().from(icalSyncSettings).limit(1);
      if (!existing.length) throw new TRPCError({ code: "NOT_FOUND", message: "No settings found" });

      await db.update(icalSyncSettings)
        .set({ isEnabled: input.isEnabled })
        .where(eq(icalSyncSettings.id, existing[0].id));
      return { success: true };
    }),
});
