import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api/base-url";
import { routing } from "@/i18n/routing";
import {
  expireSessionCookies,
  sessionCookieHeaderForBackend,
} from "@/lib/auth/session-cookie";

async function invalidateBackendSession() {
  const cookieStore = await cookies();
  const cookieHeader = sessionCookieHeaderForBackend(cookieStore);

  try {
    await fetch(`${getServerApiUrl()}/auth/sign-out`, {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
  } catch {
    // API unreachable — still clear frontend cookies.
  }
}

function isLocale(value: string): value is (typeof routing.locales)[number] {
  return routing.locales.includes(value as (typeof routing.locales)[number]);
}

function loginRedirect(request: NextRequest): string {
  const portal =
    request.nextUrl.searchParams.get("portal") === "tenant"
      ? "tenant"
      : "admin";
  const localeParam = request.nextUrl.searchParams.get("locale") ?? "";
  const locale = isLocale(localeParam)
    ? localeParam
    : routing.defaultLocale;
  const error = request.nextUrl.searchParams.get("error");
  const loginPath = `/${locale}/${portal}/login`;
  if (error === "forbidden" || error === "deactivated") {
    return `${loginPath}?error=${error}`;
  }
  return loginPath;
}

export async function POST() {
  await invalidateBackendSession();
  const cookieStore = await cookies();
  expireSessionCookies(cookieStore);
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  await invalidateBackendSession();
  const cookieStore = await cookies();
  expireSessionCookies(cookieStore);
  return NextResponse.redirect(new URL(loginRedirect(request), request.url));
}
