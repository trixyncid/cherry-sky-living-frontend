import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    /**
     * Server-only backend URL — read at runtime on Vercel (no client bundle inlining).
     * Prefer this over NEXT_PUBLIC_API_URL for proxy + SSR fetches.
     */
    API_URL: z.string().url().optional(),
    /**
     * Shared with the backend (same value in both). Lets the API proxy vouch
     * for the visitor's IP so the backend's rate limits apply per visitor
     * and can't be dodged with a forged X-Forwarded-For.
     */
    PROXY_SHARED_SECRET: z.string().min(32).optional(),
    /** Bearer secret the admin sends to POST /api/revalidate on publish. */
    REVALIDATE_SECRET: z.string().min(16).optional(),
    /** Secret for /api/preview (draft mode). */
    PREVIEW_SECRET: z.string().min(16).optional(),
  },
  client: {
    /**
     * Optional legacy / build-time hint. Client-side fetch code no longer depends
     * on this — browser traffic always goes through /api/backend.
     */
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    API_URL: process.env.API_URL,
    PROXY_SHARED_SECRET: process.env.PROXY_SHARED_SECRET,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    PREVIEW_SECRET: process.env.PREVIEW_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  emptyStringAsUndefined: true,
});
