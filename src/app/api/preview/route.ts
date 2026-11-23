/**
 * Draft preview for the admin:
 *   /api/preview?secret=<PREVIEW_SECRET>&redirect=/
 *   /api/preview?disable=1
 * Only same-site paths are accepted as the redirect target.
 */

import { timingSafeEqual } from "node:crypto";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("redirect") ?? "/";
  const path =
    target.startsWith("/") && !target.startsWith("//") ? target : "/";
  const draft = await draftMode();

  if (url.searchParams.has("disable")) {
    draft.disable();
    redirect(path);
  }

  const secret = process.env.PREVIEW_SECRET;
  const given = url.searchParams.get("secret") ?? "";
  if (
    !secret ||
    secret.length < 16 ||
    given.length !== secret.length ||
    !timingSafeEqual(Buffer.from(given), Buffer.from(secret))
  )
    return new Response("Invalid preview secret", { status: 401 });

  draft.enable();
  redirect(path);
}
