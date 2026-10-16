"use client";

import { useMemo } from "react";
import { adminNavItems } from "@/features/admin/constants/nav-items";
import { useLeases } from "@/features/admin/hooks/use-admin-queries";

/** Longest nav href matching the current path (so /admin/units/1 → Units). */
export function activeNavHref(pathname: string): string | null {
  const matches = adminNavItems.filter((item) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((a, b) => (b.href.length > a.href.length ? b : a)).href;
}

/** Renewal requests a tenant submitted that staff have not yet handled. */
export function usePendingRenewals(): number {
  const { data: leases = [] } = useLeases();
  return useMemo(
    () =>
      leases.filter((lease) => {
        const r = lease.leaseRenewal;
        return (
          Boolean(r?.isRenewLease) && !r?.isConfirmed && !r?.markAsCompleted
        );
      }).length,
    [leases],
  );
}
