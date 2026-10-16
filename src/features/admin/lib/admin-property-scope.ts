/** Last concrete property the admin worked in (not "All properties"). */
export const ADMIN_PROPERTY_SCOPE_KEY = "admin.selectedPropertyId";

export function readStoredPropertyId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(ADMIN_PROPERTY_SCOPE_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export function writeStoredPropertyId(propertyId: string): void {
  if (typeof window === "undefined" || !propertyId) return;
  try {
    window.localStorage.setItem(ADMIN_PROPERTY_SCOPE_KEY, propertyId);
  } catch {
    // Ignore quota / private-mode failures.
  }
}
