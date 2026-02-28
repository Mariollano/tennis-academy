import { z } from "zod";
import Stripe from "stripe";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { bookings, payments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-02-25.clover" });

export const stripeRouter = router({
  createCheckout: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      programName: z.string(),
      amountCents: z.number().min(50),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: ctx.user.email || undefined,
        allow_promotion_codes: true,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: input.programName,
                description: `RI Tennis Academy — ${input.programName}`,
              },
              unit_amount: input.amountCents,
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          booking_id: input.bookingId.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        },
        success_url: `${input.origin}/profile?payment=success`,
        cancel_url: `${input.origin}/profile?payment=cancelled`,
      });

      return { url: session.url };
    }),

  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(payments).where(eq(payments.userId, ctx.user.id));
  }),
});
