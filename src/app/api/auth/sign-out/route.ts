import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { getServerApiUrl } from "@/lib/api/base-url";
import {
  expireSessionCookies,
  isSecureRequest,
  sessionCookieHeaderForBackend,
} from "@/lib/auth/session-cookie";

const SIGN_OUT_TIMEOUT_MS = 10_000;

/** Reasons the app itself redirects here via GET (see lib/auth/guards.ts). */
const GET_SIGN_OUT_ERRORS = new Set(["forbidden", "deactivated", "session"]);

async function invalidateBackendSession() {
  const cookieStore = await cookies();
  const cookieHeader = sessionCookieHeaderForBackend(cookieStore);

  try {
    await fetch(`${getServerApiUrl()}/auth/sign-out`, {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(SIGN_OUT_TIMEOUT_MS),
    });
  } catch {
    // API unreachable or timed out — still clear frontend cookies.
  }
}

async function signOut(request: NextRequest) {
  await invalidateBackendSession();
  const cookieStore = await cookies();
  expireSessionCookies(cookieStore, isSecureRequest(request));
}

function isLocale(value: string): value is (typeof routing.locales)[number] {
  return routing.locales.includes(value as (typeof routing.locales)[number]);
}

function loginRedirect(request: NextRequest, error: string | null): string {
  const portal =
    request.nextUrl.searchParams.get("portal") === "tenant"
      ? "tenant"
      : "admin";
  const localeParam = request.nextUrl.searchParams.get("locale") ?? "";
  const locale = isLocale(localeParam) ? localeParam : routing.defaultLocale;
  const loginPath = `/${locale}/${portal}/login`;
  if (error && GET_SIGN_OUT_ERRORS.has(error)) {
    return `${loginPath}?error=${error}`;
  }
  return loginPath;
}

/** Normal logout (signOutClient). */
export async function POST(request: NextRequest) {
  await signOut(request);
  return NextResponse.json({ ok: true });
}

/**
 * Server-side redirects (wrong portal / deactivated account) land here as a
 * navigation. A plain GET — e.g. a cross-site <img src> — must not log the
 * visitor out, so it only redirects to the portal login.
 */
export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  // Navigations ("document") and the App Router's RSC fetch ("empty") only;
  // never an <img>, <script>, <iframe>… pointed at this URL.
  const dest = request.headers.get("sec-fetch-dest");
  const allowedDest = !dest || dest === "document" || dest === "empty";

  if (error && GET_SIGN_OUT_ERRORS.has(error) && allowedDest) {
    await signOut(request);
    return NextResponse.redirect(
      new URL(loginRedirect(request, error), request.url),
    );
  }

  return NextResponse.redirect(
    new URL(loginRedirect(request, null), request.url),
  );
}
