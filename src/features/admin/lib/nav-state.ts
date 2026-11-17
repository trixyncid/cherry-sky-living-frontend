"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  adminNavItems,
  adminProfileIcon,
} from "@/features/admin/constants/nav-items";
import { usePathname } from "@/i18n/routing";
import { getAdminTasks } from "@/lib/api/admin/tasks";
import { contactSummary } from "@/lib/phone";
import { adminKeys } from "@/lib/query/keys";

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

export type AdminTaskKind = "payment" | "renewal" | "renewalLease";

/** Something the landlord has to act on, linked to where it's done. */
export type AdminTask = {
  id: string;
  kind: AdminTaskKind;
  tenant: string;
  unit: string;
  /** Bill number, for payments. */
  sequence?: number;
  /** Amount on the bill, for payments. */
  amount?: number;
  /** When it came in (receipt sent / request made), newest first. */
  at: string;
  href: string;
};

export type AdminTasks = {
  payments: AdminTask[];
  renewals: AdminTask[];
  renewalLeases: AdminTask[];
  total: number;
};

/** How often the counts refresh while the admin is open. */
const TASKS_REFRESH_MS = 60_000;

/**
 * The landlord's to-do counts, from a small dedicated endpoint (not the full
 * lease list):
 * - payments: bills with a receipt waiting for approval
 * - renewals: tenant renewal requests not yet answered
 * - renewalLeases: approved renewals whose new lease isn't created yet
 * Keyed under leases, so any lease/bill change refreshes the badges too.
 */
export function useAdminTasks(): AdminTasks {
  const { data } = useQuery({
    queryKey: [...adminKeys.leases.all(), "tasks"],
    queryFn: getAdminTasks,
    refetchInterval: TASKS_REFRESH_MS,
  });
  return useMemo(() => {
    const tenantOf = (lease: {
      userId: string;
      user: { name: string; phoneNumber: string | null; email: string } | null;
    }) => lease.user?.name || contactSummary(lease.user) || lease.userId;

    const payments: AdminTask[] = (data?.bills ?? []).map((inv) => ({
      id: `payment:${inv.id}`,
      kind: "payment",
      tenant: tenantOf(inv.lease),
      unit: inv.lease.unit?.name ?? "—",
      sequence: inv.sequence,
      amount: inv.amount,
      at: inv.updatedAt,
      href: `/admin/leases/${inv.lease.id}/edit`,
    }));
    const renewals: AdminTask[] = [];
    const renewalLeases: AdminTask[] = [];
    for (const r of data?.renewals ?? []) {
      (r.isConfirmed ? renewalLeases : renewals).push({
        id: `${r.isConfirmed ? "renewalLease" : "renewal"}:${r.id}`,
        kind: r.isConfirmed ? "renewalLease" : "renewal",
        tenant: tenantOf(r.lease),
        unit: r.lease.unit?.name ?? "—",
        at: r.updatedAt,
        href: `/admin/leases/${r.lease.id}/edit`,
      });
    }
    const newest = (a: AdminTask, b: AdminTask) => b.at.localeCompare(a.at);
    payments.sort(newest);
    renewals.sort(newest);
    renewalLeases.sort(newest);
    return {
      payments,
      renewals,
      renewalLeases,
      total: payments.length + renewals.length + renewalLeases.length,
    };
  }, [data]);
}

/** Badge count per nav item (Leases, Lease renewals). */
export function navTaskBadge(key: string, tasks: AdminTasks): number {
  if (key === "leases") return tasks.payments.length;
  if (key === "leaseRenewals") {
    return tasks.renewals.length + tasks.renewalLeases.length;
  }
  return 0;
}

/** Icon of the page the current route belongs to (matches the sidebar). */
export function useCurrentPageIcon(): string | null {
  const pathname = usePathname();
  if (pathname.startsWith("/admin/profile")) return adminProfileIcon;
  const href = activeNavHref(pathname);
  return adminNavItems.find((item) => item.href === href)?.icon ?? null;
}
