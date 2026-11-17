import type { Lease } from "@/lib/types/admin";

/** People a room holds when the unit sets no max occupancy (matches backend). */
export const DEFAULT_ROOM_CAPACITY = 2;

/** Total people (primary tenant + roommates) a unit allows. */
export function unitCapacity(unit?: { maxOccupancy?: number | null } | null) {
  return unit?.maxOccupancy ?? DEFAULT_ROOM_CAPACITY;
}

/** Everyone living under the lease: primary tenant first, then roommates. */
export function leaseResidents(lease: Lease) {
  const primary = lease.user
    ? [{ id: lease.user.id, name: lease.user.name, isPrimary: true }]
    : [];
  const roommates = (lease.occupants ?? []).map((o) => ({
    id: o.userId,
    name: o.user?.name ?? "—",
    isPrimary: false,
  }));
  return [...primary, ...roommates];
}
