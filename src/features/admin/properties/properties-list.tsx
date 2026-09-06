"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminTableShell } from "@/features/admin/components/admin-table-shell";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import { AdminRowActions } from "@/features/admin/crud/admin-row-actions";
import { getPropertySortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import {
  useProperties,
  usePropertyMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { countPropertyAttachments } from "@/features/admin/lib/attachments";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import type { Property } from "@/lib/types/admin";

const BASE = "/admin/properties";

export function PropertiesList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.properties");
  const ta = useTranslations("admin.attachments");
  const { data = [], isLoading, error } = useProperties();
  const mutations = usePropertyMutations();
  const deleteDialog = useDeleteDialog<Property>();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    );
  }, [data, search]);

  const getSortValue = useCallback(
    (item: Property, key: string) => getPropertySortValue(item, key),
    [],
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

      <div className="relative mb-6 max-w-md">
        <Icon
          name="search"
          size={20}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746b]"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-[#e3e2e0] bg-white/80 pl-10 pr-4 text-sm outline-none focus:border-ferrugem/50 focus:ring-2 focus:ring-ferrugem/15"
        />
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
          <p className="p-8 text-center text-sm text-[#83746b]">{t("empty")}</p>
        ) : (
          <AdminCrudTable
            columns={[
              { key: "name", label: t("name") },
              { key: "address", label: t("address") },
              { key: "city", label: t("city") },
              { key: "attachments", label: ta("column") },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={onSort}
          >
            {pageData.map((property) => (
              <AdminCrudTableRow key={property.id}>
                <AdminCrudTableCell className="font-semibold">
                  {property.name}
                </AdminCrudTableCell>
                <AdminCrudTableCell className="text-[#51443c]">
                  {property.address}
                </AdminCrudTableCell>
                <AdminCrudTableCell>{property.city}</AdminCrudTableCell>
                <AdminCrudTableCell className="tabular-nums text-[#51443c]">
                  {countPropertyAttachments(property)}
                </AdminCrudTableCell>
                <AdminCrudTableCell align="right">
                  <AdminRowActions
                    editHref={`${BASE}/${property.id}/edit`}
                    onDelete={() => deleteDialog.openDelete(property)}
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
