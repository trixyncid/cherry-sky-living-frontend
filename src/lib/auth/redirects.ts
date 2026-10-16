import { normalizeRole, isTenantRole } from "@/lib/auth/role";
import { isStaffRole, type UserRole } from "@/lib/types/auth";

/** Default landing route after a successful sign-in, by role. */
export function getHomePathForRole(role: UserRole | string): string {
  const normalized = normalizeRole(role);
  if (normalized && isStaffRole(normalized)) {
    return "/admin";
  }
  if (isTenantRole(normalized)) {
    return "/tenant";
  }
  return "/";
}
