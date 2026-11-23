/**
 * Called by the admin after publishing content:
 *   POST /api/revalidate  { "tags": ["media", "sections"] }
 *   Authorization: Bearer <REVALIDATE_SECRET>
 * Only the known landing tags are accepted.
 */

import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { LANDING_TAGS } from "@/lib/landing/get-landing";

const bodySchema = z.object({
  tags: z.array(z.enum(LANDING_TAGS)).min(1).max(LANDING_TAGS.length),
});

function authorised(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || secret.length < 16 || given.length !== secret.length)
    return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export async function POST(request: Request) {
  if (!authorised(request))
    return Response.json({ error: "unauthorised" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "invalid tags" }, { status: 400 });
  for (const tag of parsed.data.tags) revalidateTag(tag, "max");
  return Response.json({ revalidated: parsed.data.tags });
}
