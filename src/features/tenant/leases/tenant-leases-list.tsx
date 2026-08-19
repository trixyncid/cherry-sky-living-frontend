"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { adminSearchInputClassName } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminTableShell } from "@/features/admin/components/admin-table-shell";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import { getTenantLeaseSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import {
  formatDate,
  formatIdrTable,
} from "@/features/admin/lib/format";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { useTenantLeases } from "@/features/tenant/hooks/use-tenant-queries";
import { LeaseRenewalPrompt } from "@/features/tenant/leases/lease-renewal-prompt";
import { getTenantRenewalView } from "@/features/tenant/lib/lease-renewal";

const BASE = "/tenant/leases";

export function TenantLeasesList() {
  const t = useTranslations("tenant.common");
  const tp = useTranslations("tenant.pages.leases");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error } = useTenantLeases();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((lease) => {
      const unit = lease.unit?.name ?? "";
      const property = lease.unit?.property?.name ?? "";
      const unitType = lease.unit?.unitType?.name ?? "";
      return [unit, property, unitType, lease.status]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [data, search]);

  const getSortValue = useCallback(
    (item: (typeof data)[number], key: string) =>
      getTenantLeaseSortValue(item, key),
    [],
  );

  const { page, setPage, pageData, total, pageSize, sortKey, sortDir, onSort } =
    useClientTable(filtered, getSortValue, { defaultSortKey: "period" });

  const renewalNotices = useMemo(
    () => data.filter((lease) => getTenantRenewalView(lease) !== "none"),
    [data],
  );

  return (
    <>
      <AdminPageHeader title={tp("title")} description={tp("description")} />

      {renewalNotices.length > 0 && (
        <div className="mb-4 space-y-3">
          {renewalNotices.map((lease) => (
            <LeaseRenewalPrompt key={lease.id} lease={lease} compact />
          ))}
        </div>
      )}

      <div className="mb-4">
        <div className="relative max-w-md">
          <Icon
            name="search"
            size={20}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746b]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tp("searchPlaceholder")}
            className={adminSearchInputClassName}
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
              { key: "unit", label: t("unit") },
              { key: "period", label: t("period") },
              { key: "status", label: t("status") },
              { key: "rent", label: t("rent") },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={onSort}
          >
            {pageData.map((lease) => {
              const rent = lease.unitPricing?.price ?? 0;

              return (
                <AdminCrudTableRow key={lease.id} className="group">
                  <AdminCrudTableCell className="font-semibold">
                    <div>
                      <p>{lease.unit?.name ?? "—"}</p>
                      <p className="text-xs font-normal text-[#83746b]">
                        {lease.unit?.property?.name ?? "—"}
                        {lease.unit?.unitType?.name
                          ? ` · ${lease.unit.unitType.name}`
                          : ""}
                      </p>
                    </div>
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    <div>
                      <p>{formatDate(lease.startDate, locale)}</p>
                      <p className="text-xs text-[#83746b]">
                        {tp("to")}{" "}
                        {lease.endDate ? formatDate(lease.endDate, locale) : "—"}
                      </p>
                    </div>
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    <LeaseStatusBadge status={lease.status} />
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>{formatIdrTable(rent)}</AdminCrudTableCell>
                  <AdminCrudTableCell align="right">
                    <Link
                      href={`${BASE}/${lease.id}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-white/60 hover:text-[#6f4627] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                      aria-label={t("view")}
                    >
                      <Icon name="visibility" size={18} />
                    </Link>
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
