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
import { AdminDateRangePicker } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import {
  AdminToolbar,
  usePropertyToolbarFilter,
} from "@/features/admin/components/admin-toolbar";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import { getLedgerEntrySortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import { useAdminPropertyFilter } from "@/features/admin/hooks/use-admin-property-filter";
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
  const { propertyId: propertyFilter, setPropertyId: setPropertyFilter } =
    useAdminPropertyFilter();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
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
    // Rent paid in cash lives in petty cash, never in the bank ledger.
    for (const lease of leases) {
      if (lease.invoices?.some((inv) => inv.paymentMethod === "cash")) {
        ids.add(lease.id);
      }
    }
    return ids;
  }, [activeEntries, leases]);
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
    if (!q) return allEntries;
    // Notes are how entries are told apart, so search reads them.
    return allEntries.filter((entry) => {
      const property = entry.property?.name ?? "";
      return [entry.description, property].join(" ").toLowerCase().includes(q);
    });
  }, [allEntries, search]);

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
  const tt = useTranslations("admin.toolbar");
  const propertyToolbar = usePropertyToolbarFilter(
    propertyFilter,
    setPropertyFilter,
  );

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
          className="inline-flex h-11 items-center gap-2 rounded-md bg-success px-5 text-[15px] font-medium text-white hover:bg-success"
        >
          <Icon name="add" size={18} />
          {tb("addIncome")}
        </Link>
        <Link
          href={`${BASE}/new?type=expense`}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-hover"
        >
          <Icon name="remove" size={18} />
          {tb("addExpense")}
        </Link>
      </div>

      <AdminToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t("searchBookkeeping"),
        }}
        filters={[
          {
            key: "type",
            label: tt("type"),
            active: typeFilter !== "",
            chip:
              typeFilter === "income" ? tp("typeIncome") : tp("typeExpense"),
            onClear: () => setTypeFilter(""),
            width: "w-auto",
            control: (
              <Segmented
                label={tp("typeFilter")}
                value={typeFilter || "all"}
                onChange={(v) => {
                  setTypeFilter(v === "all" ? "" : v);
                  setPage(1);
                }}
                options={[
                  { id: "all", label: tp("allTypes") },
                  { id: "income", label: tp("typeIncome") },
                  { id: "expense", label: tp("typeExpense") },
                ]}
              />
            ),
          },
          propertyToolbar,
          {
            key: "dates",
            label: tt("dates"),
            active: Boolean(startDate || endDate),
            chip: periodLabel,
            onClear: () => {
              setStartDate("");
              setEndDate("");
            },
            width: "w-60",
            control: (
              <AdminDateRangePicker
                from={startDate}
                to={endDate}
                onFromChange={setStartDate}
                onToChange={setEndDate}
                placeholder={tp("dateRangePlaceholder")}
              />
            ),
          },
        ]}
        resultCount={loading ? undefined : total}
      />

      {/* Statement */}
      <section className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <div className={cn(panel, "flex flex-col gap-5 p-5 sm:p-6")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-fg-muted">{tb("netResult")}</p>
              <p
                className={cn(
                  "mt-1 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-none tracking-[-0.035em] tabular-nums",
                  summary.net >= 0 ? "text-fg" : "text-danger",
                )}
              >
                {summary.net < 0 ? "−" : ""}Rp{" "}
                {formatIdrTable(Math.abs(summary.net))}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {summary.expense === 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-hover px-3 py-1 text-sm font-medium text-fg-2">
                  {tp("stats.noExpenseYet")}
                </span>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
                    summary.net >= 0
                      ? "bg-success-soft text-success"
                      : "bg-danger-soft text-danger",
                  )}
                >
                  <Icon
                    name={summary.net >= 0 ? "trending_up" : "trending_down"}
                    size={16}
                  />
                  {summary.net >= 0 ? tp("stats.profit") : tp("stats.loss")}
                </span>
              )}
              <span className="rounded-full bg-hover px-3 py-1 text-xs text-fg-muted">
                {periodLabel}
              </span>
            </div>
          </div>

          <div>
            <div
              className="flex h-3 overflow-hidden rounded-full bg-hover"
              aria-hidden
            >
              <div
                className="bg-success transition-[width] duration-700"
                style={{ width: `${incomeShare}%` }}
              />
              <div className="flex-1 bg-danger" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-success-soft p-3.5">
                <p className="flex items-center gap-1.5 text-sm text-success">
                  <Icon name="south_west" size={16} />
                  {tp("stats.income")}
                </p>
                <p className="mt-1 text-xl font-medium tabular-nums text-fg">
                  {rupiah(summary.income)}
                </p>
                <p className="text-xs text-fg-muted">
                  {tp("stats.incomeHint")}
                </p>
              </div>
              <div className="rounded-2xl bg-brand-tint p-3.5">
                <p className="flex items-center gap-1.5 text-sm text-danger">
                  <Icon name="north_east" size={16} />
                  {tp("stats.expense")}
                </p>
                <p className="mt-1 text-xl font-medium tabular-nums text-fg">
                  {rupiah(summary.expense)}
                </p>
                <p className="text-xs text-fg-muted">
                  {tp("stats.expenseHint")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly cash flow: income above the line, expenses below */}
        <div className="flex flex-col rounded-lg bg-ink p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium tracking-tight">
              {tb("byMonth")}
            </h2>
            <span className="flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" />
                {tp("typeIncome")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand-bright" />
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

      {dateRangeError && (
        <p className="mb-4 text-sm text-danger">{dateRangeError}</p>
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
        <EmptyPanel icon={adminPageIcons.bookkeeping} title={t("empty")} />
      ) : (
        <section className={cn(panel, "overflow-hidden")}>
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-lg font-medium tracking-tight text-fg">
              {tb("journal")}
            </h2>
            <span className="text-sm text-fg-muted">
              {tb("entriesCount", { count: total })}
            </span>
          </header>
          {days.map((g) => (
            <div key={g.day}>
              <div className="flex items-center justify-between bg-subtle px-5 py-2 text-sm">
                <span className="font-medium text-fg-2">
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
                    g.net >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {g.net >= 0 ? "+" : "−"}
                  {rupiah(Math.abs(g.net))}
                </span>
              </div>
              <ul className="divide-y divide-line">
                {g.entries.map((entry) => {
                  // Rent rows (computed, or posted from a paid bill) are changed on the lease.
                  const fromLease =
                    isLeaseIncomeEntry(entry.id) || Boolean(entry.invoiceId);
                  const receipts = entry.attachments?.length ?? 0;
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <TypeIcon type={entry.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-fg">
                          {entry.description}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-fg-muted">
                          <span>
                            {entry.property?.name ?? tp("generalShort")}
                          </span>
                          {receipts > 0 ? (
                            <span className="inline-flex items-center gap-0.5">
                              <span aria-hidden>·</span>
                              <Icon name="attach_file" size={13} />
                              {receipts}
                            </span>
                          ) : null}
                          {fromLease ? (
                            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                              {tp("fromLease")}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-right text-[15px] font-medium tabular-nums",
                          entry.type === "income"
                            ? "text-success"
                            : "text-danger",
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
            <div className="border-t border-line">
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

/** Money in (green) or out (red); the note says what it was for. */
function TypeIcon({ type }: { type: LedgerEntryType }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        type === "income"
          ? "bg-success-soft text-success"
          : "bg-danger-soft text-danger",
      )}
    >
      <Icon name={type === "income" ? "south_west" : "north_east"} size={19} />
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
                  last ? "bg-success" : "bg-success/55",
                )}
                style={{ height: `${Math.max(3, (m.income / max) * 100)}%` }}
              />
            </div>
            <div className="h-px w-full bg-white/25" />
            <div className="flex h-16 w-full items-start justify-center">
              <div
                className={cn(
                  "w-full max-w-9 rounded-b-lg",
                  last ? "bg-brand-bright" : "bg-brand-bright/55",
                )}
                style={{ height: `${Math.max(3, (m.expense / max) * 100)}%` }}
              />
            </div>
            <span
              className={cn(
                "mt-2 text-xs",
                last ? "font-semibold text-white" : "text-white/60",
              )}
            >
              {label(m.month)}
            </span>
            <span
              className={cn(
                // Too tight on phones; the bar heights carry the story there.
                "hidden w-full truncate text-center text-xs tabular-nums sm:block",
                net >= 0 ? "text-success" : "text-brand-bright",
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
