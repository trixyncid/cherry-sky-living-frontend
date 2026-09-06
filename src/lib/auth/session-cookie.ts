import { getServerApiUrl } from "@/lib/api/base-url";

/**
 * Session cookie stored by the browser on HTTPS (production Vercel).
 * Better Auth adds the __Secure- prefix when the API runs over HTTPS.
 */
export const SESSION_COOKIE_NAME = "__Secure-better-auth.session_token";

/**
 * Session cookie stored by the browser on local HTTP dev (localhost:3000).
 * Kept separate from production so local and deployed sessions never collide.
 */
export const LOCAL_SESSION_COOKIE_NAME = SESSION_COOKIE_NAME.replace(
  /^__Secure-/,
  "",
);

/** Better Auth cookie name expected by the configured API origin. */
export function backendSessionCookieName(): string {
  return backendUsesSecureSessionCookies()
    ? SESSION_COOKIE_NAME
    : LOCAL_SESSION_COOKIE_NAME;
}

/** Cookie name the browser stores on the current frontend origin. */
export function browserSessionCookieName(isHttps: boolean): string {
  return isHttps ? SESSION_COOKIE_NAME : LOCAL_SESSION_COOKIE_NAME;
}

function backendUsesSecureSessionCookies(): boolean {
  return getServerApiUrl().startsWith("https://");
}

function rewriteSessionCookiePart(
  part: string,
  fromName: string,
  toName: string,
): string {
  const eq = part.indexOf("=");
  if (eq === -1) return part;

  const name = part.slice(0, eq);
  const value = part.slice(eq + 1);
  if (name === fromName) {
    return `${toName}=${value}`;
  }

  return part;
}

/**
 * Rewrite the session cookie in a browser Cookie header to the name the
 * configured API expects.
 *
 * - Local API (http://localhost:8000): keep `better-auth.session_token`
 * - Production API (https://…): map local cookie → `__Secure-better-auth.session_token`
 */
export function cookieHeaderForBackend(cookieHeader: string): string {
  if (!cookieHeader) return cookieHeader;

  const backendName = backendSessionCookieName();

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq === -1) return part;
      const name = part.slice(0, eq);

      if (
        name === LOCAL_SESSION_COOKIE_NAME &&
        backendName === SESSION_COOKIE_NAME
      ) {
        return rewriteSessionCookiePart(
          part,
          LOCAL_SESSION_COOKIE_NAME,
          SESSION_COOKIE_NAME,
        );
      }

      if (
        name === SESSION_COOKIE_NAME &&
        backendName === LOCAL_SESSION_COOKIE_NAME
      ) {
        return rewriteSessionCookiePart(
          part,
          SESSION_COOKIE_NAME,
          LOCAL_SESSION_COOKIE_NAME,
        );
      }

      return part;
    })
    .join("; ");
}

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
  toString: () => string;
};

/** Read the session token from the Next.js cookie store (either local or prod name). */
export function readSessionToken(cookieStore: CookieReader): string | undefined {
  return (
    cookieStore.get(LOCAL_SESSION_COOKIE_NAME)?.value ??
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );
}

/** Build a Cookie header for upstream session validation from the Next.js cookie store. */
export function sessionCookieHeaderForBackend(
  cookieStore: CookieReader,
): string {
  const token = readSessionToken(cookieStore);
  if (token) {
    return `${backendSessionCookieName()}=${token}`;
  }

  return cookieHeaderForBackend(cookieStore.toString());
}

/**
 * Adapt an upstream Set-Cookie for the frontend origin.
 * Preserves SESSION_COOKIE_NAME on HTTPS; strips __Secure-/Secure on HTTP dev
 * because browsers reject secure-prefixed cookies without HTTPS.
 */
export function setCookieForBrowser(setCookie: string, isHttps: boolean): string {
  let out = setCookie.replace(/;\s*Domain=[^;]*/gi, "");
  out = out.replace(/;\s*SameSite=None/gi, "; SameSite=Lax");

  if (!isHttps) {
    out = out
      .replace(/;\s*Secure/gi, "")
      .replace(/^__Secure-/i, "")
      .replace(/^__Host-/i, "");
  }

  return out;
}

type CookieWriter = {
  set: (
    name: string,
    value: string,
    options?: {
      path?: string;
      expires?: Date;
      maxAge?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
    },
  ) => void;
};

/** Expire session cookies on the frontend origin (Route Handler / Server Action). */
export function expireSessionCookies(cookieStore: CookieWriter): void {
  const expired = {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax" as const,
  };

  cookieStore.set(LOCAL_SESSION_COOKIE_NAME, "", expired);
  cookieStore.set(SESSION_COOKIE_NAME, "", { ...expired, secure: true });
}
