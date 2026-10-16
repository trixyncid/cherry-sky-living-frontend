"use client";

import { useLocale, useTranslations } from "next-intl";
import { Fragment, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminSearchInput } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import {
  type LeaseRenewalStatus,
  LeaseRenewalStatusBadge,
} from "@/features/admin/components/status-badge";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
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
export function LeaseRenewalsList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.leaseRenewals");
  const to = useTranslations("admin.pages.operations");
  const [propertyFilter, setPropertyFilter] = useState("");
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

  return (
    <>
      <AdminPageHeader title={tp("title")} description={tp("description")} />

      {/* Pipeline stepper (also the filter) */}
      <section className={cn(panel, "mb-5 p-3 sm:p-4")}>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
          <div className="flex min-w-[9.5rem] flex-col justify-center rounded-2xl bg-[#1c0b0a] px-4 py-3 text-white">
            <p className="flex items-center gap-2 text-sm text-white/70">
              <Icon name="autorenew" size={16} />
              {tp("stats.requested")}
            </p>
            <p className="text-3xl font-medium tabular-nums">
              {requests.length}
            </p>
            <p className="text-xs text-white/60">{tp("stats.requestedHint")}</p>
          </div>
          {STAGES.map((s, i) => {
            const active = stage === s.id;
            return (
              <Fragment key={s.id}>
                <span
                  aria-hidden
                  className="flex shrink-0 items-center text-[#c9bdb9]"
                >
                  <Icon name="chevron_right" size={22} />
                </span>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStage(active ? "all" : s.id)}
                  className={cn(
                    "flex min-w-[11rem] flex-1 flex-col items-start rounded-2xl px-4 py-3 text-left transition-colors",
                    active
                      ? "bg-[#71130d] text-white shadow-[0_14px_30px_-16px_rgb(113_19_13/0.8)]"
                      : "bg-[#faf7f6] text-[#141414] hover:bg-[#f6f0ef]",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      active ? "text-white/80" : "text-[#6b6b6b]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                        active ? "bg-white/20" : "bg-white text-[#71130d]",
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
                      active ? "text-white/70" : "text-[#857f77]",
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

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <PropertyFilter value={propertyFilter} onChange={setPropertyFilter} />
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
          className="sm:max-w-md sm:flex-1"
        />
        {stage !== "all" ? (
          <button
            type="button"
            onClick={() => setStage("all")}
            className="inline-flex h-10 items-center gap-1.5 self-start rounded-full bg-white px-4 text-sm text-[#3d3a36] hover:text-[#71130d] sm:self-auto"
          >
            <Icon name="filter_alt_off" size={16} />
            {tp("filters.all")}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      ) : null}

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : groups.length === 0 ? (
        <EmptyPanel icon="event_available" title={tp("empty")} />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <h3
                className={cn(
                  "mb-3 flex items-center gap-2 text-[15px] font-medium",
                  g.key === "overdue" ? "text-[#a1271b]" : "text-[#141414]",
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
                <span className="rounded-full bg-white px-2 py-0.5 text-sm font-normal text-[#6b6b6b]">
                  {g.rows.length}
                </span>
              </h3>
              <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[1.85rem] before:top-4 before:w-px before:bg-[#e3d6d3] sm:before:left-[2.35rem]">
                {g.rows.map((lease) => (
                  <RenewalItem key={lease.id} lease={lease} />
                ))}
              </ol>
            </section>
          ))}
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
        <span className="text-[11px] uppercase tracking-wide text-[#6b6b6b]">
          {d
            ? new Intl.DateTimeFormat(locale, { month: "short" }).format(d)
            : "—"}
        </span>
        <span className="text-2xl font-medium leading-none tabular-nums text-[#141414]">
          {d ? d.getDate() : "?"}
        </span>
        <span className="mt-0.5 text-[10px] text-[#857f77]">
          {to("deadlineShort")}
        </span>
      </div>

      <div className={cn(panel, "flex min-w-0 flex-1 flex-col gap-3 p-4")}>
        <div className="flex flex-wrap items-start gap-3">
          <Avatar name={tenant} seed={lease.userId} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-[#141414]">
              {tenant}
            </p>
            <p className="truncate text-xs text-[#6b6b6b]">
              {lease.unit?.name ?? "—"} ·{" "}
              {resolveLeasePropertyName(lease, lookups)}
            </p>
          </div>
          <LeaseRenewalStatusBadge
            status={status}
            label={tp(`status.${status}`)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#3d3a36]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#faf7f6] px-2.5 py-1 text-xs">
            <Icon name="event_busy" size={14} />
            {to("leaseEnds", { date: end ? formatDate(end, locale) : "—" })}
          </span>
          {deadline && status !== "completed" ? (
            <DueChip date={deadline} />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f6f0ef] pt-3">
          <AdminLeaseRenewalActions lease={lease} compact />
          <Link
            href={`/admin/leases/${lease.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#3d3a36] hover:bg-[#f6f0ef] hover:text-[#71130d]"
          >
            <Icon name="open_in_new" size={16} />
            {tp("viewLease")}
          </Link>
        </div>
      </div>
    </li>
  );
}
