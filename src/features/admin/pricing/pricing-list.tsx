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
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import {
  useUnitPricingMutations,
  useUnitPricings,
} from "@/features/admin/hooks/use-admin-queries";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  resolvePricingPropertyName,
  resolvePricingUnitTypeName,
} from "@/features/admin/lib/entity-display";
import { formatIdrTable } from "@/features/admin/lib/format";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import {
  DAILY_DURATION_DAYS,
  MONTHLY_DURATION_DAYS,
} from "@/lib/billing";
import type { UnitPricing } from "@/lib/types/admin";

const BASE = "/admin/pricing";

type PricingPair = {
  unitTypeId: string;
  propertyId: string;
  monthly: UnitPricing | null;
  daily: UnitPricing | null;
  /** Prefer monthly id for edit URL; fall back to daily. */
  editId: string;
  sample: UnitPricing;
};

export function PricingList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.pricing");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error } = useUnitPricings({
    propertyId: propertyFilter || undefined,
  });
  const mutations = useUnitPricingMutations();
  const deleteDialog = useDeleteDialog<PricingPair>();
  const lookups = useAdminLookups();

  const pairs = useMemo(() => {
    const byUnitType = new Map<string, PricingPair>();
    for (const row of data) {
      const existing = byUnitType.get(row.unitTypeId);
      if (!existing) {
        const monthly =
          row.durationDays === MONTHLY_DURATION_DAYS ? row : null;
        const daily = row.durationDays === DAILY_DURATION_DAYS ? row : null;
        byUnitType.set(row.unitTypeId, {
          unitTypeId: row.unitTypeId,
          propertyId: row.propertyId,
          monthly,
          daily,
          editId: (monthly ?? daily ?? row).id,
          sample: row,
        });
        continue;
      }
      if (row.durationDays === MONTHLY_DURATION_DAYS) {
        existing.monthly = row;
        existing.editId = row.id;
        existing.sample = row;
      } else if (row.durationDays === DAILY_DURATION_DAYS) {
        existing.daily = row;
        if (!existing.monthly) {
          existing.editId = row.id;
          existing.sample = row;
        }
      }
    }
    return Array.from(byUnitType.values());
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pairs;
    return pairs.filter((row) =>
      [
        resolvePricingUnitTypeName(row.sample, lookups),
        resolvePricingPropertyName(row.sample, lookups),
        row.monthly ? String(row.monthly.price) : "",
        row.daily ? String(row.daily.price) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [pairs, search, lookups]);

  const getSortValue = useCallback(
    (item: PricingPair, key: string) => {
      switch (key) {
        case "unitType":
          return resolvePricingUnitTypeName(item.sample, lookups).toLowerCase();
        case "property":
          return resolvePricingPropertyName(item.sample, lookups).toLowerCase();
        case "monthly":
          return item.monthly?.price ?? -1;
        case "daily":
          return item.daily?.price ?? -1;
        default:
          return "";
      }
    },
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
  } = useClientTable(filtered, getSortValue, { defaultSortKey: "unitType" });

  async function confirmDelete() {
    if (!deleteDialog.item) return;
    try {
      const { monthly, daily } = deleteDialog.item;
      if (monthly) await mutations.remove.mutateAsync(monthly.id);
      if (daily) await mutations.remove.mutateAsync(daily.id);
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
              { key: "unitType", label: t("unitType") },
              { key: "property", label: t("property") },
              { key: "monthly", label: tp("monthlyPrice") },
              { key: "daily", label: tp("dailyPrice") },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={onSort}
          >
            {pageData.map((row) => (
              <AdminCrudTableRow key={row.unitTypeId}>
                <AdminCrudTableCell className="font-semibold">
                  {resolvePricingUnitTypeName(row.sample, lookups)}
                </AdminCrudTableCell>
                <AdminCrudTableCell className="text-[#51443c]">
                  {resolvePricingPropertyName(row.sample, lookups)}
                </AdminCrudTableCell>
                <AdminCrudTableCell className="font-semibold tabular-nums">
                  {row.monthly
                    ? `Rp ${formatIdrTable(row.monthly.price)}`
                    : "—"}
                </AdminCrudTableCell>
                <AdminCrudTableCell className="font-semibold tabular-nums">
                  {row.daily ? `Rp ${formatIdrTable(row.daily.price)}` : "—"}
                </AdminCrudTableCell>
                <AdminCrudTableCell align="right">
                  <AdminRowActions
                    editHref={`${BASE}/${row.editId}/edit`}
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
        itemName={
          deleteDialog.item
            ? resolvePricingUnitTypeName(deleteDialog.item.sample, lookups)
            : ""
        }
        onConfirm={() => void confirmDelete()}
        pending={pending}
      />
    </>
  );
}
