import Stripe from "stripe";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../_core/trpc";
import { DONATION, isAllowedReturnOrigin } from "../../shared/donation";

export const donationRouter = router({
  createCheckout: publicProcedure
    .input(z.object({ origin: z.string().min(1) }))
    .mutation(async ({ input }) => {
      if (!isAllowedReturnOrigin(input.origin)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A valid site address is required to start checkout." });
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Secure payments are not configured yet." });
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" as any });
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        submit_type: "donate",
        customer_creation: "always",
        billing_address_collection: "auto",
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: DONATION.productName,
              description: DONATION.productDescription,
            },
            unit_amount: DONATION.amountCents,
          },
          quantity: 1,
        }],
        metadata: { type: "donation_35" },
        success_url: `${input.origin}/donate?payment=success`,
        cancel_url: `${input.origin}/donate?payment=cancelled`,
      });

      if (!session.url) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to start secure checkout." });
      }

      return { url: session.url };
    }),
});
