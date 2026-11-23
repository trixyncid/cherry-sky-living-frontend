/**
 * Server-side loader for the landing content. Tagged so the admin can
 * refresh it on publish (POST /api/revalidate); draft mode bypasses the cache.
 */

import "server-only";
import { draftMode } from "next/headers";
import { getServerApiUrl } from "@/lib/api/base-url";
import { FALLBACK_LANDING } from "./fallback";
import { type LandingContent, landingContentSchema } from "./schema";

export const LANDING_TAGS = [
  "properties",
  "rooms",
  "media",
  "sections",
  "landmarks",
  "testimonials",
  "faq",
] as const;

export async function getLandingContent(): Promise<LandingContent> {
  try {
    const { isEnabled: preview } = await draftMode();
    const res = await fetch(
      `${getServerApiUrl()}/public/landing${preview ? "?preview=1" : ""}`,
      {
        signal: AbortSignal.timeout(8000),
        ...(preview
          ? { cache: "no-store" as const }
          : { next: { revalidate: 300, tags: [...LANDING_TAGS] } }),
      },
    );
    if (!res.ok) return FALLBACK_LANDING;
    const body = (await res.json()) as { data?: unknown };
    const parsed = landingContentSchema.safeParse(body.data ?? body);
    if (!parsed.success) return FALLBACK_LANDING;
    const content = parsed.data;
    // A property the admin has not filled in yet keeps its fallback.
    const properties = FALLBACK_LANDING.properties.map(
      (fallback) =>
        content.properties.find((p) => p.key === fallback.key) ?? fallback,
    );
    return {
      ...FALLBACK_LANDING,
      ...content,
      hero: content.hero ?? FALLBACK_LANDING.hero,
      properties,
    };
  } catch {
    return FALLBACK_LANDING;
  }
}
