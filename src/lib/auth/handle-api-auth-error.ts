import { routing } from "@/i18n/routing";
import { ApiError } from "@/lib/api/errors";
import { signOutClient } from "@/lib/auth/sign-out-client";

let redirecting = false;

/** Release the redirect lock if sign-out / navigation never completes. */
const REDIRECT_LOCK_MS = 10_000;
/** Max wait for sign-out before redirecting anyway. */
const SIGN_OUT_WAIT_MS = 5_000;

/** Message our auth middleware sends with AppError code FORBIDDEN. */
const DEACTIVATED_MESSAGE = "account deactivated";

export function isDeactivatedApiError(error: ApiError): boolean {
  if (error.status !== 403) return false;
  // Better Auth (session create) sends code ACCOUNT_DEACTIVATED.
  if (error.serverCode === "ACCOUNT_DEACTIVATED") return true;
  // Our middleware: AppError FORBIDDEN + "Account deactivated".
  return (
    error.code === "FORBIDDEN" &&
    error.message.trim().toLowerCase() === DEACTIVATED_MESSAGE
  );
}

export function isUnauthorizedApiError(error: ApiError): boolean {
  return error.status === 401 || error.code === "UNAUTHORIZED";
}

function localeFromPathname(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (
    segment &&
    routing.locales.includes(segment as (typeof routing.locales)[number])
  ) {
    return segment;
  }
  return routing.defaultLocale;
}

/** Portal from the path segment after the locale: /[locale]/admin|tenant/… */
export function portalFromPathname(
  pathname: string,
): "admin" | "tenant" | null {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const isLocale =
    !!first &&
    routing.locales.includes(first as (typeof routing.locales)[number]);
  const portal = isLocale ? segments[1] : first;
  return portal === "admin" || portal === "tenant" ? portal : null;
}

function loginPathForLocation(pathname: string): string {
  return portalFromPathname(pathname) === "admin"
    ? "/admin/login"
    : "/tenant/login";
}

async function redirectToLogin(
  errorQuery: "deactivated" | "session",
): Promise<void> {
  if (typeof window === "undefined") return;
  if (redirecting) return;

  redirecting = true;
  const unlock = setTimeout(() => {
    redirecting = false;
  }, REDIRECT_LOCK_MS);

  const locale = localeFromPathname(window.location.pathname);
  const loginPath = loginPathForLocation(window.location.pathname);

  try {
    // Don't let a hung sign-out block the redirect.
    await Promise.race([
      signOutClient(),
      new Promise((resolve) => setTimeout(resolve, SIGN_OUT_WAIT_MS)),
    ]);
    window.location.assign(`/${locale}${loginPath}?error=${errorQuery}`);
  } catch {
    clearTimeout(unlock);
    redirecting = false;
  }
}

/** Signs out and redirects when the API reports a deactivated account (403). */
export async function handleDeactivatedApiError(
  error: unknown,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!(error instanceof ApiError) || !isDeactivatedApiError(error))
    return false;

  await redirectToLogin("deactivated");
  return true;
}

/** Signs out and redirects when the API reports an expired/missing session (401). */
export async function handleUnauthorizedApiError(
  error: unknown,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!(error instanceof ApiError) || !isUnauthorizedApiError(error))
    return false;

  // Public catalogue / search can 401 only if misconfigured; still clear ghost sessions
  // when the user is on an authenticated portal route.
  if (!portalFromPathname(window.location.pathname)) return false;

  await redirectToLogin("session");
  return true;
}

/** Shared auth failure handling for apiFetch / apiFetchFormData. */
export async function handleApiAuthError(error: unknown): Promise<boolean> {
  if (await handleDeactivatedApiError(error)) return true;
  if (await handleUnauthorizedApiError(error)) return true;
  return false;
}
