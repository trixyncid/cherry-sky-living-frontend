import { redirect } from "next/navigation";
import { getHomePathForRole } from "@/lib/auth/redirects";
import {
  assertCanAccessAdminPortal,
  assertCanAccessTenantPortal,
} from "@/lib/auth/role";
import { resolveSessionRole } from "@/lib/auth/role.server";
import { type AuthSession, getSession } from "@/lib/auth/server";
import type { UserRole } from "@/lib/types/auth";

function rejectAndSignOut(
  locale: string,
  portal: "admin" | "tenant",
  error: "forbidden" | "deactivated",
): never {
  const params = new URLSearchParams({ locale, portal, error });
  redirect(`/api/auth/sign-out?${params.toString()}`);
}

export async function requireAdmin(locale: string): Promise<AuthSession> {
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  if (session.user.isActive === false) {
    rejectAndSignOut(locale, "admin", "deactivated");
  }

  const role = await resolveSessionRole(session.user.role);
  const access = assertCanAccessAdminPortal(role);

  if (!access.ok) {
    rejectAndSignOut(locale, "admin", "forbidden");
  }

  return {
    ...session,
    user: { ...session.user, role: role as UserRole },
  };
}

export async function requireTenant(locale: string): Promise<AuthSession> {
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/tenant/login`);
  }

  if (session.user.isActive === false) {
    rejectAndSignOut(locale, "tenant", "deactivated");
  }

  const role = await resolveSessionRole(session.user.role);
  const access = assertCanAccessTenantPortal(role);

  if (!access.ok) {
    rejectAndSignOut(locale, "tenant", "forbidden");
  }

  return {
    ...session,
    user: { ...session.user, role: role as UserRole },
  };
}

/** Redirect authenticated users away from the login page to their home route. */
export async function requireGuest(locale: string) {
  const session = await getSession();

  if (session) {
    const role = await resolveSessionRole(session.user.role);
    redirect(`/${locale}${getHomePathForRole(role ?? session.user.role)}`);
  }
}
