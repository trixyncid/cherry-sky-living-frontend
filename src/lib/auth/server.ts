import { cookies, headers } from "next/headers";
import { getServerApiUrl } from "@/lib/api/base-url";
import { sessionCookieHeaderForBackend } from "@/lib/auth/session-cookie";
import type { User } from "@/lib/types/auth";

export interface AuthSession {
  user: User;
  session: {
    id: string;
    expiresAt: string;
  };
}

interface GetSessionResponse {
  user: User | null;
  session: AuthSession["session"] | null;
}

/**
 * Server-side session fetch.
 *
 * Calls Railway DIRECTLY from the Next.js server process — no loopback through
 * the /api/backend proxy. The proxy is only needed client-side (to store the
 * cookie on the Vercel origin). Once the cookie is on the Vercel domain the
 * Next.js cookieStore already holds the session token, so we can forward it
 * straight to Railway for validation.
 */
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieHeader = sessionCookieHeaderForBackend(cookieStore);

  let response: Response;

  try {
    response = await fetch(`${getServerApiUrl()}/auth/get-session`, {
      headers: {
        cookie: cookieHeader,
        "user-agent": headerStore.get("user-agent") ?? "",
        "x-forwarded-for": headerStore.get("x-forwarded-for") ?? "",
        "x-real-ip": headerStore.get("x-real-ip") ?? "",
      },
      cache: "no-store",
    });
  } catch {
    // API unreachable (e.g. ECONNREFUSED when backend is not running)
    return null;
  }

  if (!response.ok) return null;

  const data = (await response.json()) as GetSessionResponse | null;
  if (!data?.user || !data.session) return null;

  const raw = data.user as User & { image?: string | null; isActive?: boolean };

  return {
    user: {
      ...raw,
      isActive: raw.isActive !== false,
      avatar: raw.avatar ?? raw.image ?? undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    },
    session: data.session,
  };
}

/**
 * Invalidate the current session on the API.
 *
 * Note: we intentionally do not mutate Next.js cookies here, because this
 * helper is used from layouts/other server components where cookie mutation
 * is not allowed. The Better Auth backend is responsible for clearing its
 * own session cookie on the API origin.
 */
export async function signOutSession(): Promise<void> {
  const cookieStore = await cookies();
  const cookieHeader = sessionCookieHeaderForBackend(cookieStore);

  try {
    await fetch(`${getServerApiUrl()}/auth/sign-out`, {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
  } catch {
    // API unreachable — nothing else to do here.
  }
}
