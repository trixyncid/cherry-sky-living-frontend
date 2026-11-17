import { normalizeRole } from "@/lib/auth/role";
import type { User } from "@/lib/types/auth";

/** Extract role from Better Auth sign-in / session user payloads. */
export function getRoleFromAuthUser(
  user: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!user) return undefined;
  return normalizeRole(user.role);
}

export function getRoleFromSignInData(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as { user?: User };
  return getRoleFromAuthUser(
    record.user as Record<string, unknown> | undefined,
  );
}
