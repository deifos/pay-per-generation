import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Stripe from "stripe";
import { z } from "zod";
import { env } from "~/env.mjs";

export const stripeRouter = createTRPCRouter({
  availableGenerations: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.id) {
      const generatedCount = await ctx.prisma.generations.count({
        where: { userId: ctx.session.user.id },
      });
      const packagesPaid = await ctx.prisma.payment.count({
        where: { userId: ctx.session.user.id },
      });
      console.log("generatedCount ", packagesPaid);
      const remainingAvailableCount =
        env.NEXT_PUBLIC_GENERATIONS_COUNT_FREE_TRIAL +
        packagesPaid * env.NEXT_PUBLIC_GENERATIONS_COUNT_PER_PURCHASE -
        generatedCount;
      return remainingAvailableCount;
    } else {
      return 0;
    }
  }),
  insertOneFakeGeneration: protectedProcedure.mutation(
    async ({ ctx, input }) => {
      const post = await ctx.prisma.generations.create({
        data: {
          prompt: "asd",
          userId: ctx.session.user.id,
        },
      });
      return post;
    }
  ),
  getStripePayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const stripe = new Stripe(env.STRIPEV2_SECRET_KEY!, {
        apiVersion: "2022-11-15",
      });
      const checkout_session: Stripe.Checkout.Session =
        await stripe.checkout.sessions.retrieve(input.paymentId, {
          expand: ["payment_intent"],
        });
      return checkout_session;
    }),
  confirmPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const paymentExists = await ctx.prisma.payment.findFirst({
        where: { stripeId: input.paymentId },
      });
      if (paymentExists) {
        return paymentExists;
      } else {
        const stripe = new Stripe(env.STRIPEV2_SECRET_KEY!, {
          apiVersion: "2022-11-15",
        });
        const stripePayment: Stripe.Checkout.Session =
          await stripe.checkout.sessions.retrieve(input.paymentId, {
            expand: ["payment_intent"],
          });
        if (stripePayment.status === "complete") {
          const payment = await ctx.prisma.payment.create({
            data: {
              userId: ctx.session.user.id,
              currency: stripePayment.currency ?? "---",
              customerName:
                stripePayment.customer_details?.name ??
                ctx.session.user.name ??
                ctx.session.user.email ??
                ctx.session.user.id,
              paymentMethod: stripePayment.payment_method_types.join(","),
              status: stripePayment.status,
              stripeId: input.paymentId,
              totalPaid: stripePayment.amount_total ?? 0,
            },
          });
          return payment;
        } else {
          return null;
        }
      }
    }),
});
