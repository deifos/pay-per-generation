import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";
const validateNumber = z.string().transform((val, ctx) => {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not a number",
    });
    return z.NEVER;
  }
  return parsed;
});

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string().min(1) : z.string().url()
    ),
    GOOGLE_CLIENT: z.string().min(1),
    GOOGLE_SECRET: z.string().min(1),
    STRIPE_PK: z.string().min(1),
    STRIPE_SK: z.string().min(1),
    STRIPE_PRICE_ID: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),

    STRIPEV2_SECRET_KEY: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
    NEXT_PUBLIC_STRIPEV2_PUBLIC_KEY: z.string().min(1),
    NEXT_PUBLIC_GENERATIONS_COUNT_PER_PURCHASE: validateNumber,
    NEXT_PUBLIC_GENERATIONS_COUNT_FREE_TRIAL: validateNumber,
    NEXT_PUBLIC_GENERATIONS_PACKAGE_COST: validateNumber,
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT: process.env.GOOGLE_CLIENT,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    STRIPE_PK: process.env.STRIPE_PK,
    STRIPE_SK: process.env.STRIPE_SK,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPEV2_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_STRIPEV2_PUBLIC_KEY,
    STRIPEV2_SECRET_KEY: process.env.STRIPEV2_SECRET_KEY,
    NEXT_PUBLIC_GENERATIONS_COUNT_PER_PURCHASE:
      process.env.NEXT_PUBLIC_GENERATIONS_COUNT_PER_PURCHASE,
    NEXT_PUBLIC_GENERATIONS_COUNT_FREE_TRIAL:
      process.env.NEXT_PUBLIC_GENERATIONS_COUNT_FREE_TRIAL,
    NEXT_PUBLIC_GENERATIONS_PACKAGE_COST:
      process.env.NEXT_PUBLIC_GENERATIONS_PACKAGE_COST,
  },
});
