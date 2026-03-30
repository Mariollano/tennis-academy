import { z } from "zod";
import Stripe from "stripe";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { bookings, payments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-02-25.clover" });

export const stripeRouter = router({
  // Public so guests (not logged in) can also pay by card
  createCheckout: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      programName: z.string(),
      amountCents: z.number().min(50),
      origin: z.string(),
      successPath: z.string().optional(),
      // Guest fields — used when no session cookie is present
      guestEmail: z.string().email().optional(),
      guestName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Resolve customer identity: prefer logged-in user, fall back to guest fields
      const customerEmail = ctx.user?.email || input.guestEmail || undefined;
      const customerId = ctx.user?.id?.toString() || "guest";
      const customerName = ctx.user?.name || input.guestName || "";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: customerEmail,
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
        client_reference_id: customerId,
        metadata: {
          user_id: customerId,
          booking_id: input.bookingId.toString(),
          customer_email: customerEmail || "",
          customer_name: customerName,
        },
        success_url: `${input.origin}${input.successPath || "/profile"}?payment=success`,
        cancel_url: `${input.origin}${input.successPath || "/profile"}?payment=cancelled`,
      });

      return { url: session.url };
    }),

  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(payments).where(eq(payments.userId, ctx.user.id));
  }),
});
