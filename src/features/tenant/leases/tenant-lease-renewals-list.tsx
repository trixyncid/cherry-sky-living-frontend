"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate } from "@/features/admin/lib/format";
import { useTenantLeases } from "@/features/tenant/hooks/use-tenant-queries";
import { LeaseRenewalPrompt } from "@/features/tenant/leases/lease-renewal-prompt";
import {
  getTenantRenewalDisplayStatus,
  hasLeaseRenewal,
  type TenantRenewalDisplayStatus,
} from "@/features/tenant/lib/lease-renewal";
import { Link } from "@/i18n/routing";
import type { Lease } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "completed";

const statusStyles: Record<TenantRenewalDisplayStatus, string> = {
  action_needed: "bg-brand-soft text-brand",
  requested: "bg-[#E8F0FE] text-[#1967D2]",
  confirmed: "bg-success-soft text-success",
  completed: "bg-blue-50 text-blue-700",
  declined: "bg-line text-fg-2",
  window_closed: "bg-danger-soft text-danger",
  not_eligible: "bg-line text-fg-2",
};

export function TenantLeaseRenewalsList() {
  const t = useTranslations("tenant.common");
  const tp = useTranslations("tenant.pages.leaseRenewals");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { data = [], isLoading, error } = useTenantLeases();

  const renewalLeases = useMemo(() => data.filter(hasLeaseRenewal), [data]);

  const metrics = useMemo(() => {
    const statuses = renewalLeases.map(
      (l) => getTenantRenewalDisplayStatus(l)!,
    );
    return {
      total: renewalLeases.length,
      actionNeeded: statuses.filter((s) => s === "action_needed").length,
      inProgress: statuses.filter((s) => s === "requested" || s === "confirmed")
        .length,
      completed: statuses.filter((s) => s === "completed").length,
    };
  }, [renewalLeases]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return renewalLeases;
    if (statusFilter === "completed") {
      return renewalLeases.filter(
        (l) => getTenantRenewalDisplayStatus(l) === "completed",
      );
    }
    return renewalLeases.filter((l) => {
      const status = getTenantRenewalDisplayStatus(l);
      return status != null && status !== "completed";
    });
  }, [renewalLeases, statusFilter]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: tp("filters.all") },
    { key: "active", label: tp("filters.active") },
    { key: "completed", label: tp("filters.completed") },
  ];

  return (
    <>
      <AdminPageHeader title={tp("title")} description={tp("description")} />

      {!isLoading && renewalLeases.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <AdminStatCard
            icon="autorenew"
            iconClassName="bg-brand/12 text-brand"
            label={tp("stats.total")}
            value={metrics.total}
          />
          <AdminStatCard
            icon="pending_actions"
            iconClassName="bg-brand-soft text-brand"
            label={tp("stats.actionNeeded")}
            value={metrics.actionNeeded}
            className={
              metrics.actionNeeded > 0 ? "ring-1 ring-brand-line" : undefined
            }
          />
          <AdminStatCard
            icon="sync"
            iconClassName="bg-[#1967D2]/12 text-[#1967D2]"
            label={tp("stats.inProgress")}
            value={metrics.inProgress}
          />
        </div>
      )}

      <div className="glass-panel mb-4 inline-flex flex-wrap gap-1 rounded-xl p-1">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStatusFilter(item.key)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              statusFilter === item.key
                ? "admin-btn-primary shadow-sm"
                : "text-fg-2 hover:bg-white/70",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-fg-muted">{t("loading")}</p>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl border-dashed p-10 text-center">
          <Icon
            name="autorenew"
            size={40}
            className="mx-auto text-fg-muted/60"
          />
          <p className="mt-4 text-sm text-fg-muted">{tp("empty")}</p>
          <Link
            href="/tenant/leases"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            {tp("viewLeases")}
            <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((lease) => (
            <RenewalCard key={lease.id} lease={lease} />
          ))}
        </div>
      )}
    </>
  );
}

function RenewalCard({ lease }: { lease: Lease }) {
  const tp = useTranslations("tenant.pages.leaseRenewals");
  const tr = useTranslations("tenant.pages.leases");
  const status = getTenantRenewalDisplayStatus(lease);
  const renewal = lease.leaseRenewal!;

  if (!status) return null;

  const showPrompt = status === "action_needed";
  const showRequestedActions = status === "requested";

  return (
    <article className="glass-panel overflow-hidden rounded-lg">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-fg">{lease.unit?.name ?? "—"}</h3>
            <p className="mt-0.5 text-sm text-fg-muted">
              {lease.unit?.property?.name ?? "—"}
            </p>
          </div>
          <TenantRenewalStatusBadge
            status={status}
            label={tp(`status.${status}`)}
          />
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <DetailItem
            label={tr("startDate")}
            value={formatDate(lease.startDate)}
          />
          <DetailItem
            label={tr("endDate")}
            value={lease.endDate ? formatDate(lease.endDate) : "—"}
          />
          <DetailItem
            label={tp("respondBy")}
            value={formatDate(renewal.confirmationDeadline)}
          />
        </dl>

        <p className="mt-3 text-sm text-fg-2">{tp(`statusHint.${status}`)}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/tenant/leases/${lease.id}`}
            className="glass-control inline-flex h-9 items-center gap-1 rounded-md px-3.5 text-sm font-medium text-fg-2 transition-colors hover:text-brand"
          >
            <Icon name="description" size={16} />
            {tp("viewLease")}
          </Link>
        </div>
      </div>

      {(showPrompt || showRequestedActions) && (
        <div className="border-t border-line bg-subtle p-5">
          <LeaseRenewalPrompt lease={lease} />
        </div>
      )}
    </article>
  );
}

function TenantRenewalStatusBadge({
  status,
  label,
}: {
  status: TenantRenewalDisplayStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
        statusStyles[status],
      )}
    >
      {label}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-fg">{value}</dd>
    </div>
  );
}
