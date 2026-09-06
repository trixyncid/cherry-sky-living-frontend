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
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import { AdminRowActions } from "@/features/admin/crud/admin-row-actions";
import { getUnitTypeSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import {
  useUnitTypeMutations,
  useUnitTypes,
} from "@/features/admin/hooks/use-admin-queries";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import { countUnitTypeAttachments } from "@/features/admin/lib/attachments";
import { resolveUnitTypePropertyName } from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import type { UnitType } from "@/lib/types/admin";

const BASE = "/admin/unit-types";

export function UnitTypesList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.unitTypes");
  const ta = useTranslations("admin.attachments");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error } = useUnitTypes(
    propertyFilter || undefined,
  );
  const mutations = useUnitTypeMutations();
  const deleteDialog = useDeleteDialog<UnitType>();
  const lookups = useAdminLookups();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        (row.description ?? "").toLowerCase().includes(q) ||
        (row.property?.name ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const getSortValue = useCallback(
    (item: UnitType, key: string) => getUnitTypeSortValue(item, key, lookups),
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
  } = useClientTable(filtered, getSortValue, { defaultSortKey: "name" });

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
              { key: "name", label: t("name") },
              { key: "property", label: t("property") },
              { key: "size", label: t("size") },
              { key: "units", label: t("unit") },
              { key: "attachments", label: ta("column") },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={onSort}
          >
            {pageData.map((row) => (
              <AdminCrudTableRow key={row.id}>
                <AdminCrudTableCell className="font-semibold">
                  <div>
                    <p>{row.name}</p>
                    {row.description && (
                      <p className="text-xs font-normal text-[#83746b]">
                        {row.description}
                      </p>
                    )}
                  </div>
                </AdminCrudTableCell>
                <AdminCrudTableCell className="text-[#51443c]">
                  {resolveUnitTypePropertyName(row, lookups)}
                </AdminCrudTableCell>
                <AdminCrudTableCell>
                  {row.size != null ? `${row.size} m²` : "—"}
                </AdminCrudTableCell>
                <AdminCrudTableCell>{row._count?.units ?? 0}</AdminCrudTableCell>
                <AdminCrudTableCell className="tabular-nums text-[#51443c]">
                  {countUnitTypeAttachments(row)}
                </AdminCrudTableCell>
                <AdminCrudTableCell align="right">
                  <AdminRowActions
                    editHref={`${BASE}/${row.id}/edit`}
                    onDelete={() => deleteDialog.openDelete(row)}
                    disabled={pending}
                  />
                </AdminCrudTableCell>
              </AdminCrudTableRow>
            ))}
          </AdminCrudTable>
        )}
      </AdminTableShell>

      <AdminDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && deleteDialog.close()}
        itemName={deleteDialog.item?.name ?? ""}
        onConfirm={confirmDelete}
        pending={pending}
      />
    </>
  );
}
