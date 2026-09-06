"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminTableShell } from "@/features/admin/components/admin-table-shell";
import { UnitStatusBadge } from "@/features/admin/components/status-badge";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import { UnitRowActions } from "@/features/admin/units/components/unit-row-actions";
import { getUnitSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
} from "@/features/admin/lib/entity-display";
import type { Unit } from "@/lib/types/admin";

interface UnitsTableViewProps {
  units: Unit[];
  lookups: AdminLookups;
  isLoading: boolean;
  onDelete: (unit: Unit) => void;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  suggestedLeaseStartDate?: string;
}

export function UnitsTableView({
  units,
  lookups,
  isLoading,
  onDelete,
  deleteDisabled,
  emptyMessage,
  suggestedLeaseStartDate,
}: UnitsTableViewProps) {
  const t = useTranslations("admin.crud");

  const getSortValue = useCallback(
    (item: Unit, key: string) => getUnitSortValue(item, key, lookups),
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
  } = useClientTable(units, getSortValue, { defaultSortKey: "name" });

  return (
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
      ) : units.length === 0 ? (
        <p className="p-8 text-center text-sm text-[#83746b]">
          {emptyMessage ?? t("empty")}
        </p>
      ) : (
        <AdminCrudTable
          columns={[
            { key: "name", label: t("name") },
            { key: "unitType", label: t("unitType") },
            { key: "maxOccupancy", label: t("maxOccupancy") },
            { key: "tenant", label: t("tenant") },
            { key: "status", label: t("status") },
            { key: "actions", label: t("actions"), align: "right" },
          ]}
          sortKey={sortKey}
          sortDirection={sortDir}
          onSort={onSort}
        >
          {pageData.map((unit) => (
            <AdminCrudTableRow key={unit.id}>
              <AdminCrudTableCell className="font-semibold">
                {unit.name}
              </AdminCrudTableCell>
              <AdminCrudTableCell className="text-[#51443c]">
                {resolveUnitTypeNameForUnit(unit, lookups)}
              </AdminCrudTableCell>
              <AdminCrudTableCell>
                {unit.maxOccupancy != null ? unit.maxOccupancy : "—"}
              </AdminCrudTableCell>
              <AdminCrudTableCell className="text-[#51443c]">
                {resolveUnitTenantLabel(unit)}
              </AdminCrudTableCell>
              <AdminCrudTableCell>
                <UnitStatusBadge status={unit.status} />
              </AdminCrudTableCell>
              <AdminCrudTableCell align="right">
                <UnitRowActions
                  unit={unit}
                  onDelete={() => onDelete(unit)}
                  disabled={deleteDisabled}
                  suggestedLeaseStartDate={suggestedLeaseStartDate}
                />
              </AdminCrudTableCell>
            </AdminCrudTableRow>
          ))}
        </AdminCrudTable>
      )}
    </AdminTableShell>
  );
}
