"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import {
  useAdminDashboard,
  useLeases,
} from "@/features/admin/hooks/use-admin-queries";
import { formatDate, formatIdrCompact } from "@/features/admin/lib/format";
import { buildViewLeaseHref } from "@/features/admin/units/lib/lease-links";
import { Link } from "@/i18n/routing";
import { useKosts } from "@/lib/hooks/use-kost-data";
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

const quickActions = [
  {
    href: "/admin/properties/new",
    icon: "add_home",
    labelKey: "quickActions.addProperty" as const,
  },
  {
    href: "/admin/unit-types/new",
    icon: "category",
    labelKey: "quickActions.addUnitType" as const,
  },
  {
    href: "/admin/units/new",
    icon: "bed",
    labelKey: "quickActions.addUnit" as const,
  },
  {
    href: "/admin/leases/new",
    icon: "post_add",
    labelKey: "quickActions.newLease" as const,
  },
  {
    href: "/admin/pricing/new",
    icon: "sell",
    labelKey: "quickActions.setPricing" as const,
  },
];

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
  const tc = useTranslations("admin.crud");
  const tRoot = useTranslations();
  const locale = useLocale();
  const { user } = useAdminShell();
  const isClient = useIsClient();

  const [propertyFilter, setPropertyFilter] = useState("");
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
    if (kind === "review")
      return td("dueAmount", { amount: formatIdrCompact(lease.amountDue) });
    if (kind === "unpaidOverdue")
      return td("daysLate", { days: lease.daysLate ?? 0 });
    if (kind === "renewal" && lease.leaseRenewal?.confirmationDeadline)
      return td("deadline", {
        date: formatDate(lease.leaseRenewal.confirmationDeadline, locale),
      });
    return td("endsOn", { date: formatDate(lease.endDate, locale) });
  };

  return (
    <div className="space-y-4">
      {dashboard.error ? <AdminAlert message={tc("loadFailed")} /> : null}

      {/* Greeting + controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#6b6b6b]" suppressHydrationWarning>
            {todayLabel}
          </p>
          <h1
            className="text-[clamp(1.5rem,2vw,1.85rem)] font-medium tracking-[-0.03em] text-[#141414]"
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
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="hidden h-11 items-center gap-2 rounded-full bg-[#71130d] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#8a1a12] lg:inline-flex"
              >
                <Icon name="add" size={18} />
                {t("board.newItem")}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="glass-overlay w-64 rounded-2xl p-2"
            >
              {quickActions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-[#141414] hover:bg-[#f6f0ef]"
                >
                  <Icon name={a.icon} size={18} />
                  {t(a.labelKey)}
                </Link>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* ——— Left column ——— */}
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-4">
          <div className="order-1 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:order-none">
            <KpiCard
              icon="pie_chart"
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
              icon="monitoring"
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
              icon="description"
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
                <h2 className="text-xl font-medium tracking-tight text-[#141414]">
                  {td("collections")}
                </h2>
                <span className="rounded-full bg-[#f6f0ef] px-3 py-1.5 text-xs text-[#6b6b6b]">
                  {td("last6")}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#6b6b6b]">{td("collectedOf")}</p>
                <p className="mt-1 text-[clamp(1.6rem,2.2vw,2rem)] font-medium tracking-[-0.03em] text-[#141414] tabular-nums">
                  {loading
                    ? "…"
                    : formatIdrCompact(collections?.monthIncome ?? 0)}
                  <span className="ml-1.5 text-base font-normal tracking-normal text-[#6b6b6b]">
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
                <h2 className="text-xl font-medium tracking-tight text-[#141414]">
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
              <div className="flex gap-5 text-sm text-[#3d3a36]">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#71130d]" />
                  {td("occupied")}
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#f1ebea] ring-1 ring-[#e6dedc]" />
                  {td("vacant")}
                </span>
              </div>
              <div className="flex flex-1 items-end rounded-2xl bg-[#faf7f6] px-4 pt-6 pb-4">
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
              <h2 className="text-xl font-medium tracking-tight text-[#141414]">
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
            <ul className="flex flex-col divide-y divide-[#f1ebea] md:hidden">
              {leasesQuery.isLoading ? (
                <li className="py-6 text-sm text-[#6b6b6b]">{t("loading")}</li>
              ) : leases.length === 0 ? (
                <li className="py-6 text-sm text-[#6b6b6b]">
                  {td("noLeases")}
                </li>
              ) : (
                leases.map((lease) => (
                  <li key={lease.id}>
                    <Link
                      href={buildViewLeaseHref(lease.id)}
                      className="flex items-center gap-3 py-3 active:bg-[#faf7f6]"
                    >
                      <Thumb
                        src={thumbFor(lease.propertyId)}
                        alt=""
                        className="size-12"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-[#141414]">
                          {lease.user?.name ?? lease.user?.email ?? "—"}
                        </span>
                        <span className="block truncate text-xs text-[#6b6b6b]">
                          {lease.unit?.name ?? "—"} ·{" "}
                          {lease.property?.name ??
                            lease.unit?.property?.name ??
                            ""}{" "}
                          · {formatDate(lease.startDate, locale)}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[15px] font-medium tabular-nums text-[#141414]">
                          {formatIdrCompact(lease.amountDue)}
                        </span>
                        <LeaseStatusBadge status={lease.status} />
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
            <div className="hidden overflow-x-auto rounded-2xl border border-[#f1ebea] md:block">
              <table className="w-full min-w-[48rem] text-left">
                <thead className="bg-[#faf7f6] text-[13px] text-[#6b6b6b]">
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
                        className="px-4 py-8 text-sm text-[#6b6b6b]"
                      >
                        {t("loading")}
                      </td>
                    </tr>
                  ) : leases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={LEASE_COLUMNS.length}
                        className="px-4 py-8 text-sm text-[#6b6b6b]"
                      >
                        {td("noLeases")}
                      </td>
                    </tr>
                  ) : (
                    leases.map((lease) => (
                      <tr
                        key={lease.id}
                        className="border-t border-[#f1ebea] text-[15px] text-[#141414] hover:bg-[#fcf9f8]"
                      >
                        <td className="px-4 py-3 font-mono text-sm text-[#6b6b6b]">
                          #{lease.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={buildViewLeaseHref(lease.id)}
                            className="flex items-center gap-3 hover:text-[#71130d]"
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
                              <span className="block truncate text-xs text-[#6b6b6b]">
                                {lease.property?.name ??
                                  lease.unit?.property?.name ??
                                  ""}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {lease.user?.name ?? lease.user?.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#3d3a36]">
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
                        <td className="px-4 py-3 text-[#3d3a36]">
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
          <section className="order-3 rounded-[1.75rem] bg-[#1c0b0a] p-5 text-white sm:p-6 xl:order-none">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-medium tracking-tight">
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
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
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
              <h2 className="text-xl font-medium tracking-tight text-[#141414]">
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
              <p className="py-6 text-sm text-[#6b6b6b]">{t("loading")}</p>
            ) : visibleQueue.length === 0 ? (
              <p className="flex items-center gap-2 rounded-2xl bg-[#faf7f6] p-5 text-[15px] text-[#3d3a36]">
                <Icon name="task_alt" size={20} className="text-[#2f6d22]" />
                {td("nothing")}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {visibleQueue.map(({ kind, lease }) => (
                  <li
                    key={`${kind}-${lease.id}`}
                    className="rounded-2xl border border-[#f1ebea] p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Thumb
                        src={thumbFor(lease.propertyId)}
                        alt=""
                        className="size-14"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-[#141414]">
                          {lease.user?.name ?? lease.user?.email ?? "—"}
                        </p>
                        <p className="truncate text-xs text-[#6b6b6b]">
                          {lease.unit?.name ?? "—"}
                          {lease.property?.name
                            ? ` · ${lease.property.name}`
                            : ""}
                        </p>
                        <span
                          className={cn(
                            "mt-1.5 inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                            kind === "unpaidOverdue"
                              ? "border-[#f5c2bd] bg-[#fde2df] text-[#a1271b]"
                              : "border-[#e8bfb9] bg-[#fbf3f2] text-[#71130d]",
                          )}
                        >
                          {t(`queues.kinds.${kind}`)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={buildViewLeaseHref(lease.id)}
                      className="mt-3 flex items-center justify-between rounded-xl bg-[#faf7f6] px-3 py-2.5 text-sm text-[#3d3a36] transition-colors hover:bg-[#f6f0ef] hover:text-[#71130d]"
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
              className="mx-auto mt-auto inline-flex h-11 items-center gap-2 rounded-full bg-[#71130d] px-6 text-[15px] font-medium text-white shadow-[0_14px_30px_-14px_rgb(113_19_13/0.7)] transition-colors hover:bg-[#8a1a12]"
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
