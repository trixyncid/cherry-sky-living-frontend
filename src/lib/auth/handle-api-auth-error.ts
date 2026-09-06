import { ApiError } from "@/lib/api/errors";
import { routing } from "@/i18n/routing";
import { signOutClient } from "@/lib/auth/sign-out-client";

let redirecting = false;

export function isDeactivatedApiError(error: ApiError): boolean {
  if (error.status !== 403) return false;
  return error.message.toLowerCase().includes("deactivated");
}

export function isUnauthorizedApiError(error: ApiError): boolean {
  return error.status === 401 || error.code === "UNAUTHORIZED";
}

function localeFromPathname(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (segment && routing.locales.includes(segment as (typeof routing.locales)[number])) {
    return segment;
  }
  return routing.defaultLocale;
}

function loginPathForLocation(pathname: string): string {
  return pathname.includes("/admin") ? "/admin/login" : "/tenant/login";
}

async function redirectToLogin(errorQuery: "deactivated" | "session"): Promise<void> {
  if (typeof window === "undefined") return;
  if (redirecting) return;

  redirecting = true;

  const locale = localeFromPathname(window.location.pathname);
  const loginPath = loginPathForLocation(window.location.pathname);

  await signOutClient();
  window.location.assign(`/${locale}${loginPath}?error=${errorQuery}`);
}

/** Signs out and redirects when the API reports a deactivated account (403). */
export async function handleDeactivatedApiError(error: unknown): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!(error instanceof ApiError) || !isDeactivatedApiError(error)) return false;

  await redirectToLogin("deactivated");
  return true;
}

/** Signs out and redirects when the API reports an expired/missing session (401). */
export async function handleUnauthorizedApiError(error: unknown): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!(error instanceof ApiError) || !isUnauthorizedApiError(error)) return false;

  // Public catalogue / search can 401 only if misconfigured; still clear ghost sessions
  // when the user is on an authenticated portal route.
  const path = window.location.pathname;
  const onPortal =
    path.includes("/admin") || path.includes("/tenant");
  if (!onPortal) return false;

  await redirectToLogin("session");
  return true;
}

/** Shared auth failure handling for apiFetch / apiFetchFormData. */
export async function handleApiAuthError(error: unknown): Promise<boolean> {
  if (await handleDeactivatedApiError(error)) return true;
  if (await handleUnauthorizedApiError(error)) return true;
  return false;
}
