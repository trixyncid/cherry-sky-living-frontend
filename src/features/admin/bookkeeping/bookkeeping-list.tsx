"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  isLeaseIncomeEntry,
  leaseToIncomeEntry,
  sumPaidLeaseIncome,
} from "@/features/admin/bookkeeping/calculate-lease-income";
import { computeLedgerSummary } from "@/features/admin/bookkeeping/compute-ledger-summary";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import {
  AdminDateRangePicker,
  AdminSearchInput,
} from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import { getLedgerEntrySortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  useLeases,
  useLedgerEntries,
  useLedgerEntryMutations,
} from "@/features/admin/hooks/use-admin-queries";
import {
  EmptyPanel,
  IconAction,
  panel,
  rupiah,
  SkeletonCards,
} from "@/features/admin/inventory/inventory-kit";
import { resolveLeasePropertyName } from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  formatDate,
  formatIdrCompact,
  formatIdrTable,
} from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { Segmented } from "@/features/admin/overview/dashboard-widgets";
import { Link } from "@/i18n/routing";
import { isLedgerCategoryForType } from "@/lib/ledger-categories";
import type { LedgerEntry, LedgerEntryType } from "@/lib/types/admin";
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
  const [categoryFilter, setCategoryFilter] = useState("");
  const tb = useTranslations("admin.pages.ledger");
  const locale = useLocale();

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

  const {
    data,
    isLoading,
    error,
    isError: ledgerError,
  } = useLedgerEntries(filters, !dateRangeError);
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
  const ledgerSummary = data?.summary ?? computeLedgerSummary(activeEntries);
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
    const inRange =
      startDate || endDate
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
    const byCategory = categoryFilter
      ? allEntries.filter((e) => categoryOf(e) === categoryFilter)
      : allEntries;
    if (!q) return byCategory;
    return byCategory.filter((entry) => {
      const property = entry.property?.name ?? "";
      return [entry.description, property].join(" ").toLowerCase().includes(q);
    });
  }, [allEntries, search, categoryFilter]);

  const getSortValue = useCallback(
    (item: LedgerEntry, key: string) => getLedgerEntrySortValue(item, key),
    [],
  );

  const { page, setPage, pageData, total, pageSize, setPageSize } =
    useClientTable(filtered, getSortValue, {
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
  const loading = isLoading || leasesLoading;

  // Monthly cash flow from everything in view (ledger + lease rent).
  const months = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const e of allEntries) {
      const key = e.date.slice(0, 7);
      const m = map.get(key) ?? { income: 0, expense: 0 };
      m[e.type] += e.amount;
      map.set(key, m);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, v]) => ({ month, ...v }));
  }, [allEntries]);

  // Category breakdown per type.
  const breakdown = useMemo(() => {
    const result: Record<LedgerEntryType, { key: string; amount: number }[]> = {
      income: [],
      expense: [],
    };
    for (const type of ["income", "expense"] as const) {
      const map = new Map<string, number>();
      for (const e of allEntries)
        if (e.type === type)
          map.set(categoryOf(e), (map.get(categoryOf(e)) ?? 0) + e.amount);
      result[type] = [...map.entries()]
        .map(([key, amount]) => ({ key, amount }))
        .sort((a, b) => b.amount - a.amount);
    }
    return result;
  }, [allEntries]);

  const days = useMemo(() => {
    const groups: { day: string; entries: LedgerEntry[]; net: number }[] = [];
    for (const e of pageData) {
      const day = e.date.slice(0, 10);
      let g = groups[groups.length - 1];
      if (!g || g.day !== day) {
        g = { day, entries: [], net: 0 };
        groups.push(g);
      }
      g.entries.push(e);
      g.net += e.type === "income" ? e.amount : -e.amount;
    }
    return groups;
  }, [pageData]);

  const periodLabel =
    startDate || endDate
      ? `${startDate ? formatDate(startDate, locale) : "…"} – ${endDate ? formatDate(endDate, locale) : "…"}`
      : tb("allTime");
  const flow = summary.income + summary.expense;
  const incomeShare = flow > 0 ? (summary.income / flow) * 100 : 50;
  const categoryLabel = (key: string) =>
    key === "none" ? tp("categoryNone") : tp(`categories.${key}`);

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        className="mb-5"
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href={`${BASE}/new?type=income`}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2f6d22] px-5 text-[15px] font-medium text-white hover:bg-[#28601d]"
        >
          <Icon name="add" size={18} />
          {tb("addIncome")}
        </Link>
        <Link
          href={`${BASE}/new?type=expense`}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#71130d] px-5 text-[15px] font-medium text-white hover:bg-[#8a1a12]"
        >
          <Icon name="remove" size={18} />
          {tb("addExpense")}
        </Link>
      </div>

      {/* Statement */}
      <section className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className={cn(panel, "flex flex-col gap-5 p-5 sm:p-6")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-[#6b6b6b]">{tb("netResult")}</p>
              <p
                className={cn(
                  "mt-1 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-none tracking-[-0.035em] tabular-nums",
                  summary.net >= 0 ? "text-[#141414]" : "text-[#a1271b]",
                )}
              >
                {summary.net < 0 ? "−" : ""}Rp{" "}
                {formatIdrTable(Math.abs(summary.net))}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
                  summary.net >= 0
                    ? "bg-[#dff3d6] text-[#2f6d22]"
                    : "bg-[#fde2df] text-[#a1271b]",
                )}
              >
                <Icon
                  name={summary.net >= 0 ? "trending_up" : "trending_down"}
                  size={16}
                />
                {summary.net >= 0 ? tp("stats.profit") : tp("stats.loss")}
              </span>
              <span className="rounded-full bg-[#f6f0ef] px-3 py-1 text-xs text-[#6b6b6b]">
                {periodLabel}
              </span>
            </div>
          </div>

          <div>
            <div
              className="flex h-3 overflow-hidden rounded-full bg-[#f1ebea]"
              aria-hidden
            >
              <div
                className="bg-[#3f9a52] transition-[width] duration-700"
                style={{ width: `${incomeShare}%` }}
              />
              <div className="flex-1 bg-[#b4463c]" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#eef8ec] p-3.5">
                <p className="flex items-center gap-1.5 text-sm text-[#2f6d22]">
                  <Icon name="south_west" size={16} />
                  {tp("stats.income")}
                </p>
                <p className="mt-1 text-xl font-medium tabular-nums text-[#141414]">
                  {rupiah(summary.income)}
                </p>
                <p className="text-xs text-[#6b6b6b]">
                  {tp("stats.incomeHint")}
                </p>
              </div>
              <div className="rounded-2xl bg-[#fbf1ef] p-3.5">
                <p className="flex items-center gap-1.5 text-sm text-[#a1271b]">
                  <Icon name="north_east" size={16} />
                  {tp("stats.expense")}
                </p>
                <p className="mt-1 text-xl font-medium tabular-nums text-[#141414]">
                  {rupiah(summary.expense)}
                </p>
                <p className="text-xs text-[#6b6b6b]">
                  {tp("stats.expenseHint")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly cash flow: income above the line, expenses below */}
        <div className="flex flex-col rounded-[1.75rem] bg-[#1c0b0a] p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium tracking-tight">
              {tb("byMonth")}
            </h2>
            <span className="flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#7fd08e]" />
                {tp("typeIncome")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#e6806f]" />
                {tp("typeExpense")}
              </span>
            </span>
          </div>
          {months.length === 0 ? (
            <p className="mt-6 text-sm text-white/60">{t("empty")}</p>
          ) : (
            <MonthChart months={months} locale={locale} />
          )}
        </div>
      </section>

      {/* Category breakdown */}
      <section className="mb-5 grid gap-4 md:grid-cols-2">
        {(["income", "expense"] as const).map((type) => {
          const rows = breakdown[type];
          const total = rows.reduce((s, r) => s + r.amount, 0);
          return (
            <div key={type} className={cn(panel, "p-5")}>
              <h3 className="mb-3 text-[15px] font-medium text-[#141414]">
                {type === "income" ? tb("whereFrom") : tb("whereTo")}
              </h3>
              {rows.length === 0 ? (
                <p className="text-sm text-[#6b6b6b]">{t("empty")}</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {rows.slice(0, 5).map((r) => {
                    const active = categoryFilter === r.key;
                    const pct = total > 0 ? (r.amount / total) * 100 : 0;
                    return (
                      <li key={r.key}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setCategoryFilter(active ? "" : r.key);
                            setPage(1);
                          }}
                          className={cn(
                            "w-full rounded-xl px-2.5 py-2 text-left transition-colors",
                            active
                              ? "bg-[#f6f0ef] ring-1 ring-[#e8bfb9]"
                              : "hover:bg-[#faf7f6]",
                          )}
                        >
                          <span className="flex items-center gap-2.5 text-sm">
                            <CategoryIcon category={r.key} type={type} small />
                            <span className="flex-1 truncate text-[#141414]">
                              {categoryLabel(r.key)}
                            </span>
                            <span className="tabular-nums text-[#3d3a36]">
                              {rupiah(r.amount)}
                            </span>
                            <span className="w-10 text-right text-xs tabular-nums text-[#857f77]">
                              {Math.round(pct)}%
                            </span>
                          </span>
                          <span className="mt-1.5 ml-9 block h-1.5 overflow-hidden rounded-full bg-[#f1ebea]">
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                type === "income"
                                  ? "bg-[#3f9a52]"
                                  : "bg-[#b4463c]",
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      {/* Filters */}
      <div className="mb-4 flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Segmented
          label={tp("typeFilter")}
          value={typeFilter || "all"}
          onChange={(v) => {
            setTypeFilter(v === "all" ? "" : v);
            setCategoryFilter("");
            setPage(1);
          }}
          options={[
            { id: "all", label: tp("allTypes") },
            { id: "income", label: tp("typeIncome") },
            { id: "expense", label: tp("typeExpense") },
          ]}
        />
        <PropertyFilter value={propertyFilter} onChange={setPropertyFilter} />
        <div className="w-full sm:w-[15rem]">
          <AdminDateRangePicker
            id="ledger-date-range"
            from={startDate}
            to={endDate}
            onFromChange={setStartDate}
            onToChange={setEndDate}
            placeholder={tp("dateRangePlaceholder")}
          />
        </div>
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
          className="lg:max-w-sm lg:flex-1"
        />
        {categoryFilter ? (
          <button
            type="button"
            onClick={() => setCategoryFilter("")}
            className="inline-flex h-10 items-center gap-1.5 self-start rounded-full bg-[#1c0b0a] px-4 text-sm text-white lg:self-auto"
          >
            {categoryLabel(categoryFilter)}
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>

      {dateRangeError && (
        <p className="mb-4 text-sm text-[#a1271b]">{dateRangeError}</p>
      )}

      {(ledgerError || leasesError) && (
        <div className="mb-4 space-y-2">
          {ledgerError && (
            <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
          )}
          {leasesError && (
            <AdminAlert
              message={getErrorMessage(
                leasesQueryError,
                tp("leasesLoadFailed"),
              )}
            />
          )}
        </div>
      )}

      {/* Journal, grouped by day */}
      {loading ? (
        <SkeletonCards count={2} />
      ) : filtered.length === 0 ? (
        <EmptyPanel icon="receipt_long" title={t("empty")} />
      ) : (
        <section className={cn(panel, "overflow-hidden")}>
          <header className="flex items-center justify-between border-b border-[#f1ebea] px-5 py-4">
            <h2 className="text-lg font-medium tracking-tight text-[#141414]">
              {tb("journal")}
            </h2>
            <span className="text-sm text-[#6b6b6b]">
              {tb("entriesCount", { count: total })}
            </span>
          </header>
          {days.map((g) => (
            <div key={g.day}>
              <div className="flex items-center justify-between bg-[#faf7f6] px-5 py-2 text-sm">
                <span className="font-medium text-[#3d3a36]">
                  {new Intl.DateTimeFormat(locale, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(`${g.day}T00:00:00`))}
                </span>
                <span
                  className={cn(
                    "tabular-nums",
                    g.net >= 0 ? "text-[#2f6d22]" : "text-[#a1271b]",
                  )}
                >
                  {g.net >= 0 ? "+" : "−"}
                  {rupiah(Math.abs(g.net))}
                </span>
              </div>
              <ul className="divide-y divide-[#f6f0ef]">
                {g.entries.map((entry) => {
                  const fromLease = isLeaseIncomeEntry(entry.id);
                  const receipts = entry.attachments?.length ?? 0;
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <CategoryIcon
                        category={categoryOf(entry)}
                        type={entry.type}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-[#141414]">
                          {entry.description}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-[#6b6b6b]">
                          <span>
                            {entry.property?.name ?? tp("noProperty")}
                          </span>
                          <span aria-hidden>·</span>
                          <span>{categoryLabel(categoryOf(entry))}</span>
                          {receipts > 0 ? (
                            <span className="inline-flex items-center gap-0.5">
                              <span aria-hidden>·</span>
                              <Icon name="attach_file" size={13} />
                              {receipts}
                            </span>
                          ) : null}
                          {fromLease ? (
                            <span className="rounded-full bg-[#f3dedb] px-2 py-0.5 text-[11px] font-medium text-[#71130d]">
                              {tp("fromLease")}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-right text-[15px] font-medium tabular-nums",
                          entry.type === "income"
                            ? "text-[#2f6d22]"
                            : "text-[#a1271b]",
                        )}
                      >
                        {entry.type === "income" ? "+" : "−"}
                        <span className="sm:hidden">
                          {rupiah(entry.amount)}
                        </span>
                        <span className="hidden sm:inline">
                          {" "}
                          Rp {formatIdrTable(entry.amount)}
                        </span>
                      </p>
                      {fromLease ? (
                        <span className="hidden w-[5.5rem] sm:block" />
                      ) : (
                        <div className="hidden shrink-0 gap-1.5 sm:flex">
                          <IconAction
                            icon="edit"
                            label={t("editTitle")}
                            href={`${BASE}/${entry.id}/edit`}
                          />
                          <IconAction
                            icon="delete"
                            tone="danger"
                            label={t("deleteConfirm")}
                            onClick={() => deleteDialog.openDelete(entry)}
                            disabled={pending}
                          />
                        </div>
                      )}
                      {!fromLease ? (
                        <span className="sm:hidden">
                          <IconAction
                            icon="chevron_right"
                            label={t("editTitle")}
                            href={`${BASE}/${entry.id}/edit`}
                          />
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {total > pageSize ? (
            <div className="border-t border-[#f1ebea]">
              <AdminPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          ) : null}
        </section>
      )}

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

/** Lease rent rows carry no category — they are rent. */
function categoryOf(entry: LedgerEntry): string {
  if (isLeaseIncomeEntry(entry.id)) return "rent";
  return entry.category && isLedgerCategoryForType(entry.type, entry.category)
    ? entry.category
    : "none";
}

const CATEGORY_ICONS: Record<string, string> = {
  rent: "key",
  deposit: "savings",
  late_fee: "alarm",
  other_income: "add_card",
  utilities: "bolt",
  maintenance: "build",
  cleaning: "cleaning_services",
  staff: "badge",
  supplies: "inventory_2",
  tax: "account_balance",
  other_expense: "receipt",
  none: "receipt_long",
};

function CategoryIcon({
  category,
  type,
  small,
}: {
  category: string;
  type: LedgerEntryType;
  small?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        small ? "size-7" : "size-10",
        type === "income"
          ? "bg-[#dff3d6] text-[#2f6d22]"
          : "bg-[#fde2df] text-[#a1271b]",
      )}
    >
      <Icon
        name={CATEGORY_ICONS[category] ?? "receipt_long"}
        size={small ? 15 : 19}
      />
    </span>
  );
}

function MonthChart({
  months,
  locale,
}: {
  months: { month: string; income: number; expense: number }[];
  locale: string;
}) {
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const label = (month: string) => {
    const [y, m] = month.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
      .format(new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, 1)))
      .toUpperCase();
  };
  return (
    <div className="mt-4 flex flex-1 items-stretch gap-2 sm:gap-3">
      {months.map((m, i) => {
        const net = m.income - m.expense;
        const last = i === months.length - 1;
        return (
          <div
            key={m.month}
            className="flex min-w-0 flex-1 flex-col items-center"
            title={`${label(m.month)} · +${rupiah(m.income)} / −${rupiah(m.expense)}`}
          >
            <div className="flex h-24 w-full items-end justify-center">
              <div
                className={cn(
                  "w-full max-w-9 rounded-t-lg",
                  last ? "bg-[#7fd08e]" : "bg-[#7fd08e]/55",
                )}
                style={{ height: `${Math.max(3, (m.income / max) * 100)}%` }}
              />
            </div>
            <div className="h-px w-full bg-white/25" />
            <div className="flex h-16 w-full items-start justify-center">
              <div
                className={cn(
                  "w-full max-w-9 rounded-b-lg",
                  last ? "bg-[#e6806f]" : "bg-[#e6806f]/55",
                )}
                style={{ height: `${Math.max(3, (m.expense / max) * 100)}%` }}
              />
            </div>
            <span
              className={cn(
                "mt-2 text-[11px]",
                last ? "font-semibold text-white" : "text-white/60",
              )}
            >
              {label(m.month)}
            </span>
            <span
              className={cn(
                "truncate text-[11px] tabular-nums",
                net >= 0 ? "text-[#9fe0ab]" : "text-[#f2a184]",
              )}
            >
              {net >= 0 ? "+" : "−"}
              {formatIdrCompact(Math.abs(net))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
