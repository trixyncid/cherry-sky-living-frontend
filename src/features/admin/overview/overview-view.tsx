"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import { useAdminPropertyFilter } from "@/features/admin/hooks/use-admin-property-filter";
import {
  useAdminDashboard,
  useLeases,
} from "@/features/admin/hooks/use-admin-queries";
import { formatDate, formatIdrCompact } from "@/features/admin/lib/format";
import { buildViewLeaseHref } from "@/features/admin/units/lib/lease-links";
import { Link } from "@/i18n/routing";
import { useKosts } from "@/lib/hooks/use-kost-data";
import { contactSummary } from "@/lib/phone";
import type {
  AdminDashboardLeaseSummary,
  LeaseStatus,
} from "@/lib/types/admin";
import { cn } from "@/lib/utils";
import { getDurationLabel } from "@/lib/utils/kost-display";
import {
  CashflowChart,
  CollectionBars,
  card,
  KpiCard,
  OccupancyGauge,
  Segmented,
  Thumb,
} from "./dashboard-widgets";
import { useIsClient } from "./use-is-client";

const LEASE_COLUMNS = [
  "colLease",
  "colUnit",
  "colTenant",
  "colTerm",
  "colAmount",
  "colStart",
  "colStatus",
] as const;

type QueueKind = "review" | "unpaidOverdue" | "renewal" | "expiring";
type QueueTab = "all" | "payments" | "renewals";
type StatusTab = "all" | LeaseStatus;

/** Compact IDR that keeps a minus sign for negative nets. */
function compact(amount: number) {
  return amount < 0
    ? `−${formatIdrCompact(-amount)}`
    : formatIdrCompact(amount);
}

function monthLabelFor(locale: string) {
  return (month: string) => {
    const [y, m] = month.split("-").map(Number);
    if (!y || !m) return month;
    return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
      .format(new Date(Date.UTC(y, m - 1, 1)))
      .toUpperCase();
  };
}

export function OverviewView() {
  const t = useTranslations("admin.pages.overview");
  const td = useTranslations("admin.pages.overview.dash");
  const tb = useTranslations("admin.pages.leases.billing");
  const tc = useTranslations("admin.crud");
  const tRoot = useTranslations();
  const locale = useLocale();
  const { user } = useAdminShell();
  const isClient = useIsClient();

  const { propertyId: propertyFilter, setPropertyId: setPropertyFilter } =
    useAdminPropertyFilter();
  const [series, setSeries] = useState<"income" | "expense">("income");
  const [gaugeFor, setGaugeFor] = useState("all");
  const [queueTab, setQueueTab] = useState<QueueTab>("all");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");

  const dashboard = useAdminDashboard(propertyFilter || undefined);
  const leasesQuery = useLeases(
    propertyFilter ? { propertyId: propertyFilter } : undefined,
  );
  const { data: kosts = [] } = useKosts();
  const data = dashboard.data;
  const loading = dashboard.isLoading;

  const portfolio = data?.portfolio;
  const collections = data?.collections;
  const leaseStats = data?.leases;
  const months = (data?.cashFlow?.months ?? []).slice(-12);
  const monthLabel = monthLabelFor(locale);
  const thumbFor = (propertyId?: string | null) =>
    kosts.find((k) => k.id === propertyId)?.thumbnail;

  // Net vs previous month — only shown when there is a previous month.
  const lastNet = months.at(-1)?.net ?? 0;
  const prevNet = months.at(-2)?.net;
  const netChange =
    prevNet !== undefined && prevNet !== 0
      ? ((lastNet - prevNet) / Math.abs(prevNet)) * 100
      : null;

  const occupiedPct =
    portfolio && portfolio.totalUnits > 0
      ? (portfolio.occupiedUnits / portfolio.totalUnits) * 100
      : 0;

  const gaugeOptions = [
    { id: "all", label: td("allResidences") },
    ...kosts
      .filter((k) => k.totalRooms > 0)
      .map((k) => ({ id: k.id, label: k.name })),
  ];
  const gaugeKost = kosts.find((k) => k.id === gaugeFor);
  const gaugePct =
    gaugeKost && gaugeKost.totalRooms > 0
      ? ((gaugeKost.totalRooms - gaugeKost.availableRooms) /
          gaugeKost.totalRooms) *
        100
      : occupiedPct;

  const queue = useMemo(() => {
    const q = data?.queues;
    if (!q)
      return [] as { kind: QueueKind; lease: AdminDashboardLeaseSummary }[];
    return [
      ...(q.unpaidOverdue ?? []).map((lease) => ({
        kind: "unpaidOverdue" as const,
        lease,
      })),
      ...q.awaitingReview.map((lease) => ({ kind: "review" as const, lease })),
      ...q.overdueRenewals.map((lease) => ({
        kind: "renewal" as const,
        lease,
      })),
      ...q.expiringSoon.map((lease) => ({ kind: "expiring" as const, lease })),
    ];
  }, [data?.queues]);
  const visibleQueue = queue
    .filter(({ kind }) =>
      queueTab === "all"
        ? true
        : queueTab === "payments"
          ? kind === "review" || kind === "unpaidOverdue"
          : kind === "renewal" || kind === "expiring",
    )
    .slice(0, 4);

  const leases = [...(leasesQuery.data ?? [])]
    .filter((l) => statusTab === "all" || l.status === statusTab)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const greetingKey = isClient ? getGreeting() : "morning";
  const todayLabel = isClient
    ? new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Asia/Jakarta",
      }).format(new Date())
    : " ";

  const queueDetail = (kind: QueueKind, lease: AdminDashboardLeaseSummary) => {
    const bill = lease.invoice
      ? `${tb("billLabel", { n: lease.invoice.sequence })} · `
      : "";
    if (kind === "review")
      return (
        bill + td("dueAmount", { amount: formatIdrCompact(lease.amountDue) })
      );
    if (kind === "unpaidOverdue")
      return bill + td("daysLate", { days: lease.daysLate ?? 0 });
    if (kind === "renewal" && lease.leaseRenewal?.confirmationDeadline)
      return td("deadline", {
        date: formatDate(lease.leaseRenewal.confirmationDeadline, locale),
      });
    return td("endsOn", { date: formatDate(lease.endDate, locale) });
  };

  return (
    <div className="space-y-5">
      {dashboard.error ? <AdminAlert message={tc("loadFailed")} /> : null}

      {/* Greeting + controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-fg-muted" suppressHydrationWarning>
            {todayLabel}
          </p>
          <h1
            className="text-[clamp(1.5rem,2vw,1.875rem)] font-semibold tracking-[-0.025em] text-fg"
            suppressHydrationWarning
          >
            {td("greeting", {
              greeting: t(`greeting.${greetingKey}`),
              name: user.name.split(" ")[0] || user.name,
            })}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PropertyFilter value={propertyFilter} onChange={setPropertyFilter} />
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_23rem]">
        {/* ——— Left column ——— */}
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-4">
          <div className="order-1 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:order-none">
            <KpiCard
              icon={adminPageIcons.units}
              tone="brand"
              label={td("occupancy")}
              value={`${Math.round(occupiedPct)}%`}
              loading={loading}
              badge={{
                tone: "neutral",
                text: td("vacantUnits", { count: portfolio?.vacantUnits ?? 0 }),
              }}
              note={t("occupancyHint", {
                occupied: portfolio?.occupiedUnits ?? 0,
                total: portfolio?.totalUnits ?? 0,
              })}
            />
            <KpiCard
              icon={adminPageIcons.bookkeeping}
              label={td("netMonth")}
              value={compact(collections?.monthNet ?? 0)}
              loading={loading}
              badge={
                netChange === null
                  ? undefined
                  : {
                      tone: netChange >= 0 ? "up" : "down",
                      text: `${Math.abs(netChange).toFixed(Math.abs(netChange) < 10 ? 1 : 0)}%`,
                    }
              }
              note={netChange === null ? td("noHistory") : td("vsLastMonth")}
            />
            <KpiCard
              icon="account_balance_wallet"
              label={td("receivables")}
              value={formatIdrCompact(collections?.accountsReceivable ?? 0)}
              loading={loading}
              badge={{
                tone:
                  (collections?.unpaidOverdueCount ?? 0) > 0
                    ? "down"
                    : "neutral",
                text: td("overdueCount", {
                  count: collections?.unpaidOverdueCount ?? 0,
                }),
              }}
            />
            <KpiCard
              icon={adminPageIcons.leases}
              label={td("activeLeases")}
              value={String(leaseStats?.activePaid ?? 0)}
              loading={loading}
              badge={{
                tone: "neutral",
                text: td("expiringCount", {
                  count: leaseStats?.expiringSoonCount ?? 0,
                }),
              }}
            />
          </div>

          <div className="order-4 grid gap-4 lg:grid-cols-2 xl:order-none">
            <section className={cn(card, "flex flex-col gap-5")}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-fg">
                  {td("collections")}
                </h2>
                <span className="rounded-full bg-hover px-3 py-1.5 text-xs text-fg-muted">
                  {td("last6")}
                </span>
              </div>
              <div>
                <p className="text-sm text-fg-muted">{td("collectedOf")}</p>
                <p className="mt-1 text-[clamp(1.6rem,2.2vw,2rem)] font-medium tracking-[-0.03em] text-fg tabular-nums">
                  {loading
                    ? "…"
                    : formatIdrCompact(collections?.monthIncome ?? 0)}
                  <span className="ml-1.5 text-base font-normal tracking-normal text-fg-muted">
                    {td("contracted", {
                      amount: formatIdrCompact(
                        collections?.contractedActiveValue ?? 0,
                      ),
                    })}
                  </span>
                </p>
              </div>
              <CollectionBars
                months={months.slice(-6)}
                monthLabel={monthLabel}
                formatValue={formatIdrCompact}
              />
            </section>

            <section className={cn(card, "flex flex-col gap-5")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-fg">
                  {td("occupancyTarget")}
                </h2>
                {gaugeOptions.length > 2 ? (
                  <Segmented
                    label={td("occupancyTarget")}
                    value={gaugeFor}
                    options={gaugeOptions}
                    onChange={setGaugeFor}
                  />
                ) : null}
              </div>
              <div className="flex gap-5 text-sm text-fg-2">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-brand" />
                  {td("occupied")}
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-hover ring-1 ring-line" />
                  {td("vacant")}
                </span>
              </div>
              <div className="flex flex-1 items-end rounded-xl bg-subtle px-4 pt-6 pb-4">
                <OccupancyGauge
                  percent={loading ? 0 : gaugePct}
                  caption={td("occupiedLabel")}
                />
              </div>
            </section>
          </div>

          {/* Leases table (cards on phones) */}
          <section
            className={cn(card, "order-5 flex flex-col gap-4 xl:order-none")}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-fg">
                {td("leases")}
              </h2>
              <Segmented
                label={td("leases")}
                value={statusTab}
                onChange={setStatusTab}
                options={[
                  { id: "all", label: td("statusAll") },
                  { id: "paid", label: td("statusPaid") },
                  { id: "unpaid", label: td("statusUnpaid") },
                  { id: "waiting_for_review", label: td("statusReview") },
                ]}
              />
            </div>
            <ul className="flex flex-col divide-y divide-line md:hidden">
              {leasesQuery.isLoading ? (
                <li className="py-6 text-sm text-fg-muted">{t("loading")}</li>
              ) : leases.length === 0 ? (
                <li className="py-6 text-sm text-fg-muted">{td("noLeases")}</li>
              ) : (
                leases.map((lease) => (
                  <li key={lease.id}>
                    <Link
                      href={buildViewLeaseHref(lease.id)}
                      className="flex items-center gap-3 py-3 active:bg-subtle"
                    >
                      <Thumb
                        src={thumbFor(lease.propertyId)}
                        alt=""
                        className="size-12"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-fg">
                          {lease.user?.name ||
                            contactSummary(lease.user) ||
                            "—"}
                        </span>
                        <span className="block truncate text-xs text-fg-muted">
                          {lease.unit?.name ?? "—"} ·{" "}
                          {lease.property?.name ??
                            lease.unit?.property?.name ??
                            ""}{" "}
                          · {formatDate(lease.startDate, locale)}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[15px] font-medium tabular-nums text-fg">
                          {formatIdrCompact(lease.amountDue)}
                        </span>
                        <LeaseStatusBadge status={lease.status} />
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
            <div className="hidden overflow-x-auto rounded-xl border border-line md:block">
              <table className="w-full min-w-[48rem] text-left">
                <thead className="bg-subtle text-xs font-medium uppercase tracking-wide text-fg-muted">
                  <tr>
                    {LEASE_COLUMNS.map((k) => (
                      <th key={k} scope="col" className="px-4 py-3 font-medium">
                        {td(k)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leasesQuery.isLoading ? (
                    <tr>
                      <td
                        colSpan={LEASE_COLUMNS.length}
                        className="px-4 py-8 text-sm text-fg-muted"
                      >
                        {t("loading")}
                      </td>
                    </tr>
                  ) : leases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={LEASE_COLUMNS.length}
                        className="px-4 py-8 text-sm text-fg-muted"
                      >
                        {td("noLeases")}
                      </td>
                    </tr>
                  ) : (
                    leases.map((lease) => (
                      <tr
                        key={lease.id}
                        className="border-t border-line text-sm text-fg transition-colors hover:bg-subtle"
                      >
                        <td className="px-4 py-3 font-mono text-sm text-fg-muted">
                          #{lease.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={buildViewLeaseHref(lease.id)}
                            className="flex items-center gap-3 hover:text-brand"
                          >
                            <Thumb
                              src={thumbFor(lease.propertyId)}
                              alt=""
                              className="size-10"
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">
                                {lease.unit?.name ?? "—"}
                              </span>
                              <span className="block truncate text-xs text-fg-muted">
                                {lease.property?.name ??
                                  lease.unit?.property?.name ??
                                  ""}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {lease.user?.name ||
                            contactSummary(lease.user) ||
                            "—"}
                        </td>
                        <td className="px-4 py-3 text-fg-2">
                          {lease.unitPricing?.durationDays
                            ? getDurationLabel(
                                lease.unitPricing.durationDays,
                                tRoot,
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatIdrCompact(lease.amountDue)}
                        </td>
                        <td className="px-4 py-3 text-fg-2">
                          {formatDate(lease.startDate, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <LeaseStatusBadge status={lease.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ——— Right column ——— */}
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-4">
          <section className="relative order-3 overflow-hidden rounded-2xl bg-ink p-5 text-white shadow-[0_20px_40px_-24px_rgb(11_11_13/0.6)] sm:p-6 xl:order-none">
            <span
              className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-brand/35 blur-3xl"
              aria-hidden
            />
            <div className="relative flex items-center justify-between gap-3">
              <h2 className="relative text-lg font-semibold tracking-tight">
                {td("cashflow")}
              </h2>
              <Segmented
                tone="dark"
                label={td("cashflow")}
                value={series}
                onChange={setSeries}
                options={[
                  { id: "income", label: td("income") },
                  { id: "expense", label: td("expenses") },
                ]}
              />
            </div>
            <div className="relative mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              {months.length > 0 ? (
                <CashflowChart
                  months={months}
                  series={series}
                  monthLabel={monthLabel}
                  formatValue={formatIdrCompact}
                  latestLabel={td("latest")}
                />
              ) : (
                <p className="p-6 text-sm text-white/70">
                  {t("charts.cashFlow.empty")}
                </p>
              )}
            </div>
          </section>

          <section
            className={cn(
              card,
              "order-2 flex flex-1 flex-col gap-4 xl:order-none",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-fg">
                {td("attention")}
              </h2>
              <Segmented
                label={td("attention")}
                value={queueTab}
                onChange={setQueueTab}
                options={[
                  { id: "all", label: td("tabAll") },
                  { id: "payments", label: td("tabPayments") },
                  { id: "renewals", label: td("tabRenewals") },
                ]}
              />
            </div>
            {loading ? (
              <p className="py-6 text-sm text-fg-muted">{t("loading")}</p>
            ) : visibleQueue.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-success-soft p-4 text-sm text-success">
                <Icon name="task_alt" size={20} className="text-success" />
                {td("nothing")}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {visibleQueue.map(({ kind, lease }) => (
                  <li
                    key={`${kind}-${lease.invoice?.id ?? lease.id}`}
                    className="rounded-xl border border-line p-3 transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-start gap-3">
                      <Thumb
                        src={thumbFor(lease.propertyId)}
                        alt=""
                        className="size-14"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-fg">
                          {lease.user?.name ||
                            contactSummary(lease.user) ||
                            "—"}
                        </p>
                        <p className="truncate text-xs text-fg-muted">
                          {lease.unit?.name ?? "—"}
                          {lease.property?.name
                            ? ` · ${lease.property.name}`
                            : ""}
                        </p>
                        <span
                          className={cn(
                            "mt-1.5 inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                            kind === "unpaidOverdue"
                              ? "border-danger-soft bg-danger-soft text-danger"
                              : "border-brand-line bg-brand-tint text-brand",
                          )}
                        >
                          {t(`queues.kinds.${kind}`)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={buildViewLeaseHref(lease.id)}
                      className="mt-3 flex items-center justify-between rounded-lg bg-subtle px-3 py-2 text-sm text-fg-2 transition-colors hover:bg-brand-tint hover:text-brand"
                    >
                      {queueDetail(kind, lease)}
                      <Icon name="north_east" size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/leases"
              className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line-strong bg-panel px-5 text-sm font-medium text-fg transition-colors hover:border-fg hover:bg-hover"
            >
              {td("viewAllLeases")}
              <Icon name="north_east" size={16} />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
