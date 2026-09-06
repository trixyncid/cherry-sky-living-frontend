"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminSearchInput } from "@/features/admin/components/admin-field";
import { AdminFilterRow } from "@/features/admin/components/admin-filter-row";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminTableShell } from "@/features/admin/components/admin-table-shell";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import { AdminRowActions } from "@/features/admin/crud/admin-row-actions";
import { getLeaseSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import {
  useLeaseMutations,
  useLeases,
} from "@/features/admin/hooks/use-admin-queries";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  getLeaseEndDateValue,
  resolveLeasePropertyName,
  resolveLeaseTenantLabel,
} from "@/features/admin/lib/entity-display";
import {
  formatDate,
  formatIdrTable,
} from "@/features/admin/lib/format";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import type { Lease } from "@/lib/types/admin";

const BASE = "/admin/leases";

export function LeasesList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.leases");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error } = useLeases({
    propertyId: propertyFilter || undefined,
  });
  const mutations = useLeaseMutations();
  const deleteDialog = useDeleteDialog<Lease>();
  const lookups = useAdminLookups();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((lease) => {
      const unit = lease.unit?.name ?? lease.unitId;
      const property = resolveLeasePropertyName(lease, lookups);
      const tenant = resolveLeaseTenantLabel(lease);
      return [unit, property, tenant, lease.userId]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [data, search, lookups]);

  const getSortValue = useCallback(
    (item: Lease, key: string) => getLeaseSortValue(item, key, lookups),
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
  } = useClientTable(filtered, getSortValue, { defaultSortKey: "period" });

  async function confirmDelete() {
    if (!deleteDialog.item) return;
    try {
      await mutations.remove.mutateAsync(deleteDialog.item.id);
      showApiSuccess(t("deleted"));
      deleteDialog.close();
    } catch (err) {
      showApiError(err, t("deleteFailed"));
    }
  }

  const pending = mutations.remove.isPending;

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={{
          label: t("add"),
          href: `${BASE}/new`,
          icon: "add",
        }}
      />

      <AdminFilterRow>
        <PropertyFilter value={propertyFilter} onChange={setPropertyFilter} />
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
          className="sm:max-w-md sm:flex-1"
        />
      </AdminFilterRow>

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
          <p className="p-8 text-center text-sm text-[#83746b]">{t("empty")}</p>
        ) : (
          <AdminCrudTable
            columns={[
              { key: "unit", label: t("unit") },
              { key: "tenant", label: t("tenant") },
              { key: "period", label: t("period") },
              { key: "status", label: t("status") },
              { key: "rent", label: t("price") },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={onSort}
          >
            {pageData.map((lease) => {
              const rent = lease.unitPricing?.price ?? 0;
              const tenantName = resolveLeaseTenantLabel(lease);
              const endDate = getLeaseEndDateValue(lease);

              return (
                <AdminCrudTableRow key={lease.id}>
                  <AdminCrudTableCell className="font-semibold">
                    <div>
                      <p>{lease.unit?.name ?? lease.unitId}</p>
                      <p className="text-xs font-normal text-[#83746b]">
                        {resolveLeasePropertyName(lease, lookups)}
                      </p>
                    </div>
                  </AdminCrudTableCell>
                  <AdminCrudTableCell className="text-[#51443c]">
                    {tenantName}
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    <div>
                      <p>{formatDate(lease.startDate)}</p>
                      <p className="text-xs text-[#83746b]">
                        {tp("to")}{" "}
                        {endDate ? formatDate(endDate) : "—"}
                      </p>
                    </div>
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    <LeaseStatusBadge status={lease.status} />
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>{formatIdrTable(rent)}</AdminCrudTableCell>
                  <AdminCrudTableCell align="right">
                    <AdminRowActions
                      editHref={`${BASE}/${lease.id}/edit`}
                      onDelete={() => deleteDialog.openDelete(lease)}
                      disabled={pending}
                    />
                  </AdminCrudTableCell>
                </AdminCrudTableRow>
              );
            })}
          </AdminCrudTable>
        )}
      </AdminTableShell>

      <AdminDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && deleteDialog.close()}
        itemName={deleteDialog.item?.id ?? ""}
        onConfirm={confirmDelete}
        pending={pending}
      />
    </>
  );
}
