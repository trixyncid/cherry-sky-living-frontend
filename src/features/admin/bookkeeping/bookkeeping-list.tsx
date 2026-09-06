"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { AdminTableShell } from "@/features/admin/components/admin-table-shell";
import {
  AdminField,
  AdminDateRangePicker,
  AdminSearchInput,
  AdminSelect,
} from "@/features/admin/components/admin-field";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import {
  isLeaseIncomeEntry,
  leaseToIncomeEntry,
  sumPaidLeaseIncome,
} from "@/features/admin/bookkeeping/calculate-lease-income";
import { computeLedgerSummary } from "@/features/admin/bookkeeping/compute-ledger-summary";
import { LedgerTypeBadge } from "@/features/admin/bookkeeping/ledger-type-badge";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import { AdminRowActions } from "@/features/admin/crud/admin-row-actions";
import { getLedgerEntrySortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import {
  useLeases,
  useLedgerEntries,
  useLedgerEntryMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import { resolveLeasePropertyName } from "@/features/admin/lib/entity-display";
import {
  formatDate,
  formatIdrCompact,
  formatIdrTable,
} from "@/features/admin/lib/format";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import type { LedgerEntry, LedgerEntryType } from "@/lib/types/admin";
import {
  isLedgerCategoryForType,
} from "@/lib/ledger-categories";
import { cn } from "@/lib/utils";

const BASE = "/admin/bookkeeping";

type TypeFilter = "" | LedgerEntryType;

function isDateInRange(
  date: string,
  startDate: string,
  endDate: string,
): boolean {
  const day = date.slice(0, 10);
  if (startDate && day < startDate) return false;
  if (endDate && day > endDate) return false;
  return true;
}

export function BookkeepingList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.bookkeeping");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const dateRangeError = useMemo(() => {
    if (startDate && endDate && startDate > endDate) {
      return tp("invalidDateRange");
    }
    return null;
  }, [startDate, endDate, tp]);

  const filters = useMemo(
    () => ({
      ...(propertyFilter ? { propertyId: propertyFilter } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(!dateRangeError && startDate ? { startDate } : {}),
      ...(!dateRangeError && endDate ? { endDate } : {}),
    }),
    [propertyFilter, typeFilter, startDate, endDate, dateRangeError],
  );

  const { data, isLoading, error, isError: ledgerError } = useLedgerEntries(
    filters,
    !dateRangeError,
  );
  const {
    data: leases = [],
    isLoading: leasesLoading,
    isError: leasesError,
    error: leasesQueryError,
  } = useLeases(propertyFilter ? { propertyId: propertyFilter } : undefined);
  const entries = data?.data ?? [];
  const activeEntries = useMemo(
    () => entries.filter((entry) => entry.reversedAt == null),
    [entries],
  );
  const ledgerSummary =
    data?.summary ?? computeLedgerSummary(activeEntries);
  const postedRentLeaseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of activeEntries) {
      if (entry.leaseId && entry.category === "rent") {
        ids.add(entry.leaseId);
      }
    }
    return ids;
  }, [activeEntries]);
  const leaseIncome = useMemo(() => {
    const paidLeases = leases.filter(
      (l) => l.status === "paid" && !postedRentLeaseIds.has(l.id),
    );
    const inRange = startDate || endDate
      ? paidLeases.filter((lease) =>
          isDateInRange(lease.startDate, startDate, endDate),
        )
      : paidLeases;
    return sumPaidLeaseIncome(inRange);
  }, [leases, startDate, endDate, postedRentLeaseIds]);
  const summary = useMemo(
    () => ({
      income: ledgerSummary.income + leaseIncome,
      expense: ledgerSummary.expense,
      net: ledgerSummary.income + leaseIncome - ledgerSummary.expense,
    }),
    [ledgerSummary, leaseIncome],
  );
  const mutations = useLedgerEntryMutations();
  const deleteDialog = useDeleteDialog<LedgerEntry>();
  const lookups = useAdminLookups();

  const leaseIncomeEntries = useMemo(() => {
    if (typeFilter === "expense") return [];
    return leases
      .filter((lease) => !postedRentLeaseIds.has(lease.id))
      .map((lease) =>
        leaseToIncomeEntry(
          lease,
          tp("leaseIncomeDescription", {
            unit: lease.unit?.name ?? lease.unitId,
            property: resolveLeasePropertyName(lease, lookups),
          }),
        ),
      )
      .filter((row): row is LedgerEntry => row != null)
      .filter((row) => isDateInRange(row.date, startDate, endDate));
  }, [leases, typeFilter, tp, lookups, startDate, endDate, postedRentLeaseIds]);

  const allEntries = useMemo(
    () => [...leaseIncomeEntries, ...activeEntries],
    [leaseIncomeEntries, activeEntries],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allEntries;
    return allEntries.filter((entry) => {
      const property = entry.property?.name ?? "";
      return [entry.description, property]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [allEntries, search]);

  const getSortValue = useCallback(
    (item: LedgerEntry, key: string) => getLedgerEntrySortValue(item, key),
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
  } = useClientTable(filtered, getSortValue, {
      defaultSortKey: "date",
      defaultSortDirection: "desc",
    });

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

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard
          icon="trending_up"
          iconClassName="bg-[#E6F4EA] text-[#137333]"
          label={tp("stats.income")}
          value={formatIdrCompact(summary.income)}
          valuePrefix="Rp"
          hint={tp("stats.incomeHint")}
        />
        <AdminStatCard
          icon="trending_down"
          iconClassName="bg-[#ffdad6] text-[#ba1a1a]"
          label={tp("stats.expense")}
          value={formatIdrCompact(summary.expense)}
          valuePrefix="Rp"
          hint={tp("stats.expenseHint")}
        />
        <AdminStatCard
          icon="account_balance"
          iconClassName="bg-[#d3e4fe] text-[#0b1c30]"
          label={tp("stats.net")}
          value={formatIdrCompact(Math.abs(summary.net))}
          valuePrefix="Rp"
          hint={tp("stats.netHint")}
          trend={
            summary.net !== 0
              ? {
                  value: summary.net >= 0 ? tp("stats.profit") : tp("stats.loss"),
                  positive: summary.net >= 0,
                }
              : undefined
          }
        />
      </section>

      <div className="mb-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <PropertyFilter value={propertyFilter} onChange={setPropertyFilter} />
        <AdminField
          label={tp("typeFilter")}
          htmlFor="ledger-type-filter"
          className="w-full shrink-0 sm:w-[10rem]"
        >
          <AdminSelect
            id="ledger-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          >
            <option value="">{tp("allTypes")}</option>
            <option value="income">{tp("typeIncome")}</option>
            <option value="expense">{tp("typeExpense")}</option>
          </AdminSelect>
        </AdminField>
        <AdminField
          label={tp("dateRange")}
          htmlFor="ledger-date-range"
          className="w-full shrink-0 sm:w-[14rem]"
        >
          <AdminDateRangePicker
            id="ledger-date-range"
            from={startDate}
            to={endDate}
            onFromChange={setStartDate}
            onToChange={setEndDate}
            placeholder={tp("dateRangePlaceholder")}
          />
        </AdminField>
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
          className="sm:max-w-md sm:flex-1"
        />
      </div>

      {dateRangeError && (
        <p className="mb-4 text-sm text-[#ba1a1a]">{dateRangeError}</p>
      )}

      {(ledgerError || leasesError) && (
        <div className="mb-4 space-y-2">
          {ledgerError && (
            <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
          )}
          {leasesError && (
            <AdminAlert
              message={getErrorMessage(leasesQueryError, tp("leasesLoadFailed"))}
            />
          )}
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
        {isLoading || leasesLoading ? (
          <p className="p-8 text-center text-sm text-[#83746b]">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#83746b]">{t("empty")}</p>
        ) : (
          <AdminCrudTable
            columns={[
              { key: "date", label: tp("date") },
              { key: "type", label: tp("entryType") },
              { key: "description", label: t("description") },
              { key: "property", label: t("property") },
              { key: "category", label: tp("category") },
              { key: "amount", label: tp("amount"), align: "right" },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={onSort}
          >
            {pageData.map((entry) => {
              const fromLease = isLeaseIncomeEntry(entry.id);
              return (
              <AdminCrudTableRow key={entry.id}>
                <AdminCrudTableCell className="whitespace-nowrap text-[#51443c]">
                  {formatDate(entry.date)}
                </AdminCrudTableCell>
                <AdminCrudTableCell>
                  <LedgerTypeBadge type={entry.type} />
                </AdminCrudTableCell>
                <AdminCrudTableCell className="max-w-[14rem] font-medium">
                  <span className="line-clamp-2">{entry.description}</span>
                </AdminCrudTableCell>
                <AdminCrudTableCell className="text-[#51443c]">
                  {entry.property?.name ?? tp("noProperty")}
                </AdminCrudTableCell>
                <AdminCrudTableCell className="text-[#51443c]">
                  {entry.category &&
                  isLedgerCategoryForType(entry.type, entry.category)
                    ? tp(`categories.${entry.category}`)
                    : "—"}
                </AdminCrudTableCell>
                <AdminCrudTableCell align="right">
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      entry.type === "income"
                        ? "text-[#137333]"
                        : "text-[#ba1a1a]",
                    )}
                  >
                    {entry.type === "income" ? "+" : "−"} Rp{" "}
                    {formatIdrTable(entry.amount)}
                  </span>
                </AdminCrudTableCell>
                <AdminCrudTableCell align="right">
                  {fromLease ? (
                    <span className="text-xs text-[#83746b]">{tp("fromLease")}</span>
                  ) : (
                    <AdminRowActions
                      editHref={`${BASE}/${entry.id}/edit`}
                      onDelete={() => deleteDialog.openDelete(entry)}
                      disabled={pending}
                    />
                  )}
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
        itemName={deleteDialog.item?.description ?? ""}
        onConfirm={confirmDelete}
        pending={pending}
      />
    </>
  );
}
