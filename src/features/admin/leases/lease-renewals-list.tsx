"use client";

import { useLocale, useTranslations } from "next-intl";
import { Fragment, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  AdminToolbar,
  usePropertyToolbarFilter,
} from "@/features/admin/components/admin-toolbar";
import {
  type LeaseRenewalStatus,
  LeaseRenewalStatusBadge,
} from "@/features/admin/components/status-badge";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import { useAdminPropertyFilter } from "@/features/admin/hooks/use-admin-property-filter";
import { useLeases } from "@/features/admin/hooks/use-admin-queries";
import {
  EmptyPanel,
  panel,
  SkeletonCards,
} from "@/features/admin/inventory/inventory-kit";
import { AdminLeaseRenewalActions } from "@/features/admin/leases/lease-renewal-actions";
import {
  getLeaseEndDateValue,
  resolveLeasePropertyName,
  resolveLeaseTenantLabel,
} from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate } from "@/features/admin/lib/format";
import {
  Avatar,
  DueChip,
  daysUntil,
} from "@/features/admin/operations/ops-kit";
import { Link } from "@/i18n/routing";
import type { Lease } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

type Stage = "pending_confirmation" | "confirmed" | "completed";
type StageFilter = Stage | "all";

function stageOf(lease: Lease): LeaseRenewalStatus {
  const r = lease.leaseRenewal;
  if (!r?.isRenewLease) return "not_requested";
  if (r.markAsCompleted) return "completed";
  if (r.isConfirmed) return "confirmed";
  return "pending_confirmation";
}

const STAGES: { id: Stage; icon: string; labelKey: string; hintKey: string }[] =
  [
    {
      id: "pending_confirmation",
      icon: "pending_actions",
      labelKey: "stats.pendingConfirmation",
      hintKey: "stats.pendingHint",
    },
    {
      id: "confirmed",
      icon: "post_add",
      labelKey: "stats.confirmed",
      hintKey: "stats.confirmedHint",
    },
    {
      id: "completed",
      icon: "task_alt",
      labelKey: "stats.completed",
      hintKey: "stats.completedHint",
    },
  ];

/**
 * Lease renewals — a pipeline + deadline timeline. The stepper shows where
 * every request sits (tenant asked → you confirm → new lease → done) and
 * doubles as the filter; below, requests line up by their confirmation
 * deadline, overdue first, with the next action on each.
 */
const PAGE = 20;

export function LeaseRenewalsList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.leaseRenewals");
  const to = useTranslations("admin.pages.operations");
  const { propertyId: propertyFilter, setPropertyId: setPropertyFilter } =
    useAdminPropertyFilter();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<StageFilter>("pending_confirmation");
  const {
    data = [],
    isLoading,
    error,
  } = useLeases({
    propertyId: propertyFilter || undefined,
  });
  const lookups = useAdminLookups();
  const propertyToolbar = usePropertyToolbarFilter(
    propertyFilter,
    setPropertyFilter,
  );

  const requests = useMemo(
    () => data.filter((l) => l.leaseRenewal?.isRenewLease),
    [data],
  );

  const counts = useMemo(() => {
    const c: Record<Stage, number> = {
      pending_confirmation: 0,
      confirmed: 0,
      completed: 0,
    };
    for (const l of requests) {
      const s = stageOf(l);
      if (s !== "not_requested") c[s] += 1;
    }
    return c;
  }, [requests]);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = requests
      .filter((l) => stage === "all" || stageOf(l) === stage)
      .filter(
        (l) =>
          !q ||
          [
            l.unit?.name ?? "",
            resolveLeasePropertyName(l, lookups),
            resolveLeaseTenantLabel(l),
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) =>
        (a.leaseRenewal?.confirmationDeadline ?? "").localeCompare(
          b.leaseRenewal?.confirmationDeadline ?? "",
        ),
      );
    const buckets: Record<"overdue" | "week" | "later", Lease[]> = {
      overdue: [],
      week: [],
      later: [],
    };
    for (const l of rows) {
      const deadline = l.leaseRenewal?.confirmationDeadline;
      const d = deadline ? daysUntil(deadline) : 999;
      const open = stageOf(l) !== "completed";
      if (open && d < 0) buckets.overdue.push(l);
      else if (open && d <= 7) buckets.week.push(l);
      else buckets.later.push(l);
    }
    return (["overdue", "week", "later"] as const)
      .map((k) => ({ key: k, rows: buckets[k] }))
      .filter((g) => g.rows.length > 0);
  }, [requests, stage, search, lookups]);

  // Render in batches so 170+ cards don't load as one endless scroll.
  const [limit, setLimit] = useState(PAGE);
  const totalRows = groups.reduce((n, g) => n + g.rows.length, 0);
  const visibleGroups = useMemo(() => {
    let left = limit;
    return groups
      .map((g) => {
        const rows = g.rows.slice(0, Math.max(0, left));
        left -= rows.length;
        return { ...g, rows };
      })
      .filter((g) => g.rows.length > 0);
  }, [groups, limit]);

  return (
    <>
      <AdminPageHeader title={tp("title")} description={tp("description")} />

      {/* Pipeline stepper (also the filter) */}
      <section className={cn(panel, "mb-5 p-3 sm:p-4")}>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row">
          {STAGES.map((s, i) => {
            const active = stage === s.id;
            return (
              <Fragment key={s.id}>
                <span
                  aria-hidden
                  className={cn(
                    "hidden shrink-0 items-center text-fg-faint sm:flex",
                    i === 0 && "sm:hidden",
                  )}
                >
                  <Icon name="chevron_right" size={22} />
                </span>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStage(active ? "all" : s.id)}
                  className={cn(
                    "flex flex-1 flex-col items-start rounded-lg px-4 py-3 text-left transition-colors sm:min-w-[11rem]",
                    active
                      ? "bg-brand text-white"
                      : "bg-subtle text-fg hover:bg-hover",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      active ? "text-white/80" : "text-fg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                        active ? "bg-white/20" : "bg-white text-brand",
                      )}
                    >
                      {i + 1}
                    </span>
                    {tp(s.labelKey)}
                  </span>
                  <span className="mt-1 text-2xl font-medium tabular-nums">
                    {counts[s.id]}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      active ? "text-white/70" : "text-fg-muted",
                    )}
                  >
                    {tp(s.hintKey)}
                  </span>
                </button>
              </Fragment>
            );
          })}
        </div>
      </section>

      <AdminToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t("searchRenewals"),
        }}
        filters={[propertyToolbar]}
        resultCount={
          isLoading ? undefined : groups.reduce((n, g) => n + g.rows.length, 0)
        }
      />

      {error ? (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      ) : null}

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : groups.length === 0 ? (
        <EmptyPanel icon={adminPageIcons.leaseRenewals} title={tp("empty")} />
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((g) => (
            <section key={g.key}>
              <h3
                className={cn(
                  "mb-3 flex items-center gap-2 text-[15px] font-medium",
                  g.key === "overdue" ? "text-danger" : "text-fg",
                )}
              >
                <Icon
                  name={
                    g.key === "overdue"
                      ? "error"
                      : g.key === "week"
                        ? "date_range"
                        : "event"
                  }
                  size={18}
                />
                {to(`bucket.${g.key}`)}
                <span className="rounded-full bg-white px-2 py-0.5 text-sm font-normal text-fg-muted">
                  {g.rows.length}
                </span>
              </h3>
              <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[1.85rem] before:top-4 before:w-px before:bg-line sm:before:left-[2.35rem]">
                {g.rows.map((lease) => (
                  <RenewalItem key={lease.id} lease={lease} />
                ))}
              </ol>
            </section>
          ))}
          {totalRows > limit ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE)}
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-white px-5 text-sm font-medium text-fg hover:border-brand-line hover:text-brand"
              >
                {tp("showMore", { count: Math.min(PAGE, totalRows - limit) })}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

function RenewalItem({ lease }: { lease: Lease }) {
  const tp = useTranslations("admin.pages.leaseRenewals");
  const to = useTranslations("admin.pages.operations");
  const locale = useLocale();
  const lookups = useAdminLookups();
  const tenant = resolveLeaseTenantLabel(lease);
  const deadline = lease.leaseRenewal?.confirmationDeadline;
  const end = getLeaseEndDateValue(lease);
  const status = stageOf(lease);
  const d = deadline ? new Date(deadline) : null;

  return (
    <li className="relative flex gap-3 sm:gap-4">
      {/* Date marker on the rail */}
      <div className="relative z-10 flex h-fit w-[3.7rem] shrink-0 flex-col items-center rounded-2xl bg-white py-2 text-center sm:w-[4.7rem]">
        <span className="text-xs uppercase tracking-wide text-fg-muted">
          {d
            ? new Intl.DateTimeFormat(locale, { month: "short" }).format(d)
            : "—"}
        </span>
        <span className="text-2xl font-medium leading-none tabular-nums text-fg">
          {d ? d.getDate() : "?"}
        </span>
        <span className="mt-0.5 text-xs text-fg-muted">
          {to("deadlineShort")}
        </span>
      </div>

      <div className={cn(panel, "flex min-w-0 flex-1 flex-col gap-3 p-4")}>
        <div className="flex flex-wrap items-start gap-3">
          <Avatar name={tenant} seed={lease.userId} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-fg">{tenant}</p>
            <p className="truncate text-xs text-fg-muted">
              {lease.unit?.name ?? "—"} ·{" "}
              {resolveLeasePropertyName(lease, lookups)}
            </p>
          </div>
          <span className="basis-full pl-[3.25rem] sm:basis-auto sm:pl-0">
            <LeaseRenewalStatusBadge
              status={status}
              label={tp(`status.${status}`)}
            />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2.5 py-1 text-xs">
            <Icon name="event_busy" size={14} />
            {to("leaseEnds", { date: end ? formatDate(end, locale) : "—" })}
          </span>
          {deadline && status !== "completed" ? (
            <DueChip date={deadline} />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <AdminLeaseRenewalActions lease={lease} compact />
          <Link
            href={`/admin/leases/${lease.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-fg-2 hover:bg-hover hover:text-brand"
          >
            <Icon name="open_in_new" size={16} />
            {tp("viewLease")}
          </Link>
        </div>
      </div>
    </li>
  );
}
