"use client";

import { useMemo } from "react";
import {
  adminNavItems,
  adminProfileIcon,
} from "@/features/admin/constants/nav-items";
import { useLeases } from "@/features/admin/hooks/use-admin-queries";
import { resolveLeaseTenantLabel } from "@/features/admin/lib/entity-display";
import { usePathname } from "@/i18n/routing";

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
 * The landlord's to-do counts, from the lease list:
 * - payments: bills with a receipt waiting for approval
 * - renewals: tenant renewal requests not yet answered
 * - renewalLeases: approved renewals whose new lease isn't created yet
 */
export function useAdminTasks(): AdminTasks {
  const { data: leases = [] } = useLeases(undefined, {
    refetchInterval: TASKS_REFRESH_MS,
  });
  return useMemo(() => {
    const payments: AdminTask[] = [];
    const renewals: AdminTask[] = [];
    const renewalLeases: AdminTask[] = [];
    for (const lease of leases) {
      const tenant = resolveLeaseTenantLabel(lease);
      const unit = lease.unit?.name ?? "—";
      const href = `/admin/leases/${lease.id}/edit`;
      for (const inv of lease.invoices ?? []) {
        if (inv.status !== "waiting_for_review") continue;
        payments.push({
          id: `payment:${inv.id}`,
          kind: "payment",
          tenant,
          unit,
          sequence: inv.sequence,
          amount: inv.amount,
          at: inv.updatedAt ?? lease.updatedAt,
          href,
        });
      }
      const r = lease.leaseRenewal;
      if (!r?.isRenewLease || r.markAsCompleted) continue;
      const task = {
        id: `${r.isConfirmed ? "renewalLease" : "renewal"}:${r.id}`,
        kind: r.isConfirmed ? ("renewalLease" as const) : ("renewal" as const),
        tenant,
        unit,
        at: r.updatedAt,
        href,
      };
      (r.isConfirmed ? renewalLeases : renewals).push(task);
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
  }, [leases]);
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
