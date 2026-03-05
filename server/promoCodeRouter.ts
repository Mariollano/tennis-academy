import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { promoCodes, bookings } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const promoCodeRouter = router({
  // Admin: create a promo code
  create: adminProcedure
    .input(z.object({
      code: z.string().min(2).max(50).toUpperCase(),
      description: z.string().optional(),
      discountType: z.enum(["percent", "fixed", "free"]),
      discountValue: z.number().min(0).default(0), // percent 0-100 or cents for fixed
      maxUses: z.number().int().positive().optional(),
      expiresAt: z.string().optional(), // ISO date string
      appliesTo: z.array(z.string()).optional(), // program types
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check for duplicate
      const existing = await db.select({ id: promoCodes.id })
        .from(promoCodes)
        .where(eq(promoCodes.code, input.code.toUpperCase()))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A promo code with this name already exists." });
      }

      await db.insert(promoCodes).values({
        code: input.code.toUpperCase(),
        description: input.description || null,
        discountType: input.discountType,
        discountValue: input.discountType === "free" ? 100 : input.discountValue,
        maxUses: input.maxUses || null,
        usedCount: 0,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: true,
        appliesTo: input.appliesTo ? JSON.stringify(input.appliesTo) : null,
        createdBy: ctx.user.id,
      });

      return { success: true };
    }),

  // Admin: list all promo codes
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(promoCodes).orderBy(sql`createdAt DESC`);
  }),

  // Admin: toggle active/inactive
  toggleActive: adminProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(promoCodes).set({ isActive: input.isActive }).where(eq(promoCodes.id, input.id));
      return { success: true };
    }),

  // Admin: delete a promo code
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(promoCodes).where(eq(promoCodes.id, input.id));
      return { success: true };
    }),

  // Public: validate a promo code and return discount info
  validate: publicProcedure
    .input(z.object({
      code: z.string(),
      programType: z.string().optional(),
      originalAmountCents: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [promo] = await db.select().from(promoCodes)
        .where(eq(promoCodes.code, input.code.toUpperCase()))
        .limit(1);

      if (!promo) return { valid: false, message: "Invalid promo code." };
      if (!promo.isActive) return { valid: false, message: "This promo code is no longer active." };
      if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        return { valid: false, message: "This promo code has expired." };
      }
      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
        return { valid: false, message: "This promo code has reached its maximum uses." };
      }

      // Check program restriction
      if (promo.appliesTo && input.programType) {
        const allowed: string[] = JSON.parse(promo.appliesTo);
        if (allowed.length > 0 && !allowed.includes(input.programType)) {
          return { valid: false, message: "This promo code does not apply to this program." };
        }
      }

      // Calculate discounted amount
      let discountedAmountCents = input.originalAmountCents;
      let discountDescription = "";

      if (promo.discountType === "free") {
        discountedAmountCents = 0;
        discountDescription = "100% off — FREE";
      } else if (promo.discountType === "percent") {
        const discount = Math.floor(input.originalAmountCents * promo.discountValue / 100);
        discountedAmountCents = input.originalAmountCents - discount;
        discountDescription = `${promo.discountValue}% off`;
      } else if (promo.discountType === "fixed") {
        discountedAmountCents = Math.max(0, input.originalAmountCents - promo.discountValue);
        discountDescription = `$${(promo.discountValue / 100).toFixed(2)} off`;
      }

      return {
        valid: true,
        promoId: promo.id,
        code: promo.code,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountDescription,
        originalAmountCents: input.originalAmountCents,
        discountedAmountCents,
        isFree: discountedAmountCents === 0,
      };
    }),

  // Internal: mark a promo code as used (called after successful booking)
  markUsed: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(promoCodes)
        .set({ usedCount: sql`usedCount + 1` })
        .where(eq(promoCodes.code, input.code.toUpperCase()));
      return { success: true };
    }),
});
