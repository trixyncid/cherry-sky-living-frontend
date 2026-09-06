"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminSearchInput } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { AdminTableShell } from "@/features/admin/components/admin-table-shell";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import {
  LeaseRenewalStatusBadge,
  type LeaseRenewalStatus,
} from "@/features/admin/components/status-badge";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import { getLeaseRenewalSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { AdminLeaseRenewalActions } from "@/features/admin/leases/lease-renewal-actions";
import { useLeases } from "@/features/admin/hooks/use-admin-queries";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  getLeaseEndDateValue,
  resolveLeasePropertyName,
  resolveLeaseTenantLabel,
} from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate, isExpiringWithinDays } from "@/features/admin/lib/format";
import { cn } from "@/lib/utils";
import type { Lease } from "@/lib/types/admin";

type StatusFilter =
  | "all"
  | "requested"
  | "pending_confirmation"
  | "confirmed"
  | "completed";

function resolveRenewalStatus(lease: Lease): LeaseRenewalStatus {
  const renewal = lease.leaseRenewal;
  if (!renewal?.isRenewLease) return "not_requested";
  if (renewal.markAsCompleted) return "completed";
  if (renewal.isConfirmed) return "confirmed";
  return "pending_confirmation";
}

export function LeaseRenewalsList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.leaseRenewals");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("requested");
  const { data = [], isLoading, error } = useLeases({
    propertyId: propertyFilter || undefined,
  });
  const lookups = useAdminLookups();

  const metrics = useMemo(() => {
    const withRenewal = data.filter((lease) => lease.leaseRenewal);
    const requested = withRenewal.filter((l) => l.leaseRenewal?.isRenewLease);
    return {
      requested: requested.length,
      pending: requested.filter(
        (l) => !l.leaseRenewal?.isConfirmed && !l.leaseRenewal?.markAsCompleted,
      ).length,
      confirmed: requested.filter(
        (l) => l.leaseRenewal?.isConfirmed && !l.leaseRenewal?.markAsCompleted,
      ).length,
      completed: requested.filter((l) => l.leaseRenewal?.markAsCompleted).length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let rows = data.filter((lease) => lease.leaseRenewal);

    if (statusFilter === "requested") {
      rows = rows.filter((l) => l.leaseRenewal?.isRenewLease);
    } else if (statusFilter === "pending_confirmation") {
      rows = rows.filter(
        (l) =>
          l.leaseRenewal?.isRenewLease &&
          !l.leaseRenewal.isConfirmed &&
          !l.leaseRenewal.markAsCompleted,
      );
    } else if (statusFilter === "confirmed") {
      rows = rows.filter(
        (l) =>
          l.leaseRenewal?.isRenewLease &&
          l.leaseRenewal.isConfirmed &&
          !l.leaseRenewal.markAsCompleted,
      );
    } else if (statusFilter === "completed") {
      rows = rows.filter((l) => l.leaseRenewal?.markAsCompleted);
    }

    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((lease) => {
      const unit = lease.unit?.name ?? lease.unitId;
      const property = resolveLeasePropertyName(lease, lookups);
      const tenant = resolveLeaseTenantLabel(lease);
      return [unit, property, tenant, lease.userId]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [data, search, statusFilter, lookups]);

  const getSortValue = useCallback(
    (item: Lease, key: string) => getLeaseRenewalSortValue(item, key, lookups),
    [lookups],
  );

  const {
    page,
    setPage,
    pageData,
    total,
    pageSize,
    setPageSize,
    sortKey,
    sortDir,
    onSort,
  } = useClientTable(filtered, getSortValue, { defaultSortKey: "leaseEnd" });

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: "requested", label: tp("filters.requested") },
    { key: "pending_confirmation", label: tp("filters.pendingConfirmation") },
    { key: "confirmed", label: tp("filters.confirmed") },
    { key: "completed", label: tp("filters.completed") },
    { key: "all", label: tp("filters.all") },
  ];

  return (
    <>
      <AdminPageHeader title={tp("title")} description={tp("description")} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="autorenew"
          iconClassName="bg-[#FEF7E0] text-[#B06000]"
          label={tp("stats.requested")}
          value={metrics.requested}
          hint={tp("stats.requestedHint")}
        />
        <AdminStatCard
          icon="pending_actions"
          iconClassName="bg-[#ffdad6] text-[#ba1a1a]"
          label={tp("stats.pendingConfirmation")}
          value={metrics.pending}
          hint={tp("stats.pendingHint")}
        />
        <AdminStatCard
          icon="check_circle"
          iconClassName="bg-[#E6F4EA] text-[#137333]"
          label={tp("stats.confirmed")}
          value={metrics.confirmed}
          hint={tp("stats.confirmedHint")}
        />
        <AdminStatCard
          icon="task_alt"
          iconClassName="bg-blue-50 text-blue-700"
          label={tp("stats.completed")}
          value={metrics.completed}
          hint={tp("stats.completedHint")}
        />
      </div>

      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                statusFilter === item.key
                  ? "bg-[#6f4627] text-white shadow-sm"
                  : "bg-[#efeeeb] text-[#51443c] hover:bg-[#e3e2e0]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <PropertyFilter value={propertyFilter} onChange={setPropertyFilter} />
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("searchPlaceholder")}
            className="sm:max-w-md sm:flex-1"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      )}

      <AdminTableShell
        footer={
          !isLoading && total > 0 ? (
            <AdminPagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : undefined
        }
      >
        {isLoading ? (
          <p className="p-8 text-center text-sm text-[#83746b]">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#83746b]">{tp("empty")}</p>
        ) : (
          <AdminCrudTable
            columns={[
              { key: "tenant", label: t("tenant") },
              { key: "unit", label: t("unit") },
              { key: "leaseEnd", label: tp("leaseEnd") },
              { key: "deadline", label: tp("confirmationDeadline") },
              { key: "status", label: t("status") },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={onSort}
          >
            {pageData.map((lease) => {
              const renewal = lease.leaseRenewal;
              const renewalStatus = resolveRenewalStatus(lease);
              const endDate = getLeaseEndDateValue(lease);

              return (
                <AdminCrudTableRow key={lease.id}>
                  <AdminCrudTableCell className="font-semibold text-[#51443c]">
                    {resolveLeaseTenantLabel(lease)}
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    <div>
                      <p className="font-semibold">
                        {lease.unit?.name ?? lease.unitId}
                      </p>
                      <p className="text-xs text-[#83746b]">
                        {resolveLeasePropertyName(lease, lookups)}
                      </p>
                    </div>
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    {endDate ? formatDate(endDate) : "—"}
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    {renewal?.confirmationDeadline
                      ? formatDate(renewal.confirmationDeadline)
                      : "—"}
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    <LeaseRenewalStatusBadge
                      status={renewalStatus}
                      label={tp(`status.${renewalStatus}`)}
                    />
                  </AdminCrudTableCell>
                  <AdminCrudTableCell align="right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <AdminLeaseRenewalActions lease={lease} compact />
                      <Link
                        href={`/admin/leases/${lease.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#51443c] transition-colors hover:bg-[#efeeeb]"
                      >
                        <Icon name="visibility" size={16} />
                        {tp("viewLease")}
                      </Link>
                    </div>
                  </AdminCrudTableCell>
                </AdminCrudTableRow>
              );
            })}
          </AdminCrudTable>
        )}
      </AdminTableShell>
    </>
  );
}
