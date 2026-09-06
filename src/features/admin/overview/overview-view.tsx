"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { useAdminDashboard } from "@/features/admin/hooks/use-admin-queries";
import {
  formatDate,
  formatIdrCompact,
  getInitials,
} from "@/features/admin/lib/format";
import { buildViewLeaseHref } from "@/features/admin/units/lib/lease-links";
import type { AdminDashboardLeaseSummary } from "@/lib/types/admin";

const quickActions = [
  { href: "/admin/properties/new", icon: "add_home", labelKey: "quickActions.addProperty" as const },
  { href: "/admin/unit-types/new", icon: "category", labelKey: "quickActions.addUnitType" as const },
  { href: "/admin/units/new", icon: "bed", labelKey: "quickActions.addUnit" as const },
  { href: "/admin/leases/new", icon: "post_add", labelKey: "quickActions.newLease" as const },
  { href: "/admin/pricing/new", icon: "sell", labelKey: "quickActions.setPricing" as const },
];

export function OverviewView() {
  const t = useTranslations("admin.pages.overview");
  const tc = useTranslations("admin.crud");
  const locale = useLocale();
  const { user } = useAdminShell();
  const [propertyFilter, setPropertyFilter] = useState("");

  const dashboard = useAdminDashboard(propertyFilter || undefined);
  const data = dashboard.data;
  const loading = dashboard.isLoading;
  const loadError = dashboard.error;

  const greetingKey = getGreeting();
  const todayLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const portfolio = data?.portfolio;
  const collections = data?.collections;
  const leaseStats = data?.leases;
  const queues = data?.queues;

  const actionQueue = useMemo(() => {
    if (!queues) return [];
    type QueueItem = {
      kind: "review" | "unpaidOverdue" | "renewal" | "expiring";
      lease: AdminDashboardLeaseSummary;
    };
    const items: QueueItem[] = [
      ...queues.awaitingReview.map((lease) => ({
        kind: "review" as const,
        lease,
      })),
      ...(queues.unpaidOverdue ?? []).map((lease) => ({
        kind: "unpaidOverdue" as const,
        lease,
      })),
      ...queues.overdueRenewals.map((lease) => ({
        kind: "renewal" as const,
        lease,
      })),
      ...queues.expiringSoon.map((lease) => ({
        kind: "expiring" as const,
        lease,
      })),
    ];
    return items.slice(0, 8);
  }, [queues]);

  return (
    <div className="space-y-8">
      {loadError && <AdminAlert message={tc("loadFailed")} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PropertyFilter value={propertyFilter} onChange={setPropertyFilter} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="glass-panel relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8 lg:col-span-2">
          <div
            className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-ferrugem/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 left-10 size-56 rounded-full bg-maroon/14 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ferrugem">
                {t("today")} · {todayLabel}
              </p>
              <p className="mt-3 text-sm font-medium text-[#51443c]">
                {t(`greeting.${greetingKey}`)}
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#1a1c1a] sm:text-4xl">
                {user.name.split(" ")[0] ?? user.name}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#5f5e5e]">
                {t("description")}
              </p>
            </div>
            <Link
              href="/admin/leases"
              className="admin-btn-primary inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Icon name="description" size={18} />
              {t("viewLeases")}
            </Link>
          </div>
        </section>

        <section className="glass-panel relative flex flex-col items-center justify-center overflow-hidden rounded-[1.75rem] p-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(164_74_50/0.14),transparent_60%)]"
            aria-hidden
          />
          <OccupancyRing
            percent={loading ? 0 : (portfolio?.occupancyPercent ?? 0)}
            label={t("occupancy")}
            hint={t("occupancyHint", {
              occupied: portfolio?.occupiedUnits ?? 0,
              total: portfolio?.totalUnits ?? 0,
            })}
          />
        </section>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          icon="domain"
          iconClassName="bg-[#d3e4fe]/80 text-[#0b1c30]"
          label={t("stats.properties")}
          value={loading ? "…" : (portfolio?.propertyCount ?? 0)}
          hint={t("stats.propertiesHint")}
          href="/admin/properties"
        />
        <AdminStatCard
          icon="bed"
          iconClassName="bg-[#e2dfde]/80 text-[#636262]"
          label={t("stats.vacantUnits")}
          value={loading ? "…" : (portfolio?.vacantUnits ?? 0)}
          hint={t("stats.vacantUnitsHint", {
            occupied: portfolio?.occupiedUnits ?? 0,
            total: portfolio?.totalUnits ?? 0,
          })}
          href="/admin/units"
          trend={
            portfolio && portfolio.totalUnits > 0
              ? {
                  value: `${portfolio.occupancyPercent}%`,
                  positive: portfolio.occupancyPercent >= 50,
                }
              : undefined
          }
        />
        <AdminStatCard
          icon="description"
          iconClassName="bg-[#ffdcc5]/80 text-[#653d1e]"
          label={t("stats.activeLeases")}
          value={loading ? "…" : (leaseStats?.activePaid ?? 0)}
          hint={t("stats.activeLeasesHint", {
            expiring: leaseStats?.expiringSoonCount ?? 0,
          })}
          href="/admin/leases"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="account_balance_wallet"
          iconClassName="bg-[#fff0e8]/80 text-[#8b4513]"
          label={t("stats.accountsReceivable")}
          value={loading ? "…" : formatIdrCompact(collections?.accountsReceivable ?? 0)}
          hint={t("stats.accountsReceivableHint", {
            overdue: collections?.unpaidOverdueCount ?? 0,
            overdueAmount: formatIdrCompact(
              collections?.unpaidOverdueAmount ?? 0,
            ),
          })}
          href="/admin/leases"
        />
        <AdminStatCard
          icon="rate_review"
          iconClassName="bg-[#fff8e1]/80 text-[#7a5c00]"
          label={t("stats.awaitingReview")}
          value={loading ? "…" : (collections?.awaitingReviewCount ?? 0)}
          hint={t("stats.awaitingReviewHint", {
            amount: formatIdrCompact(collections?.awaitingReviewAmount ?? 0),
          })}
          href="/admin/leases"
        />
        <AdminStatCard
          icon="payments"
          iconClassName="bg-[#E6F4EA]/80 text-[#137333]"
          label={t("stats.monthIncome")}
          value={loading ? "…" : formatIdrCompact(collections?.monthIncome ?? 0)}
          hint={t("stats.monthIncomeHint", {
            contracted: formatIdrCompact(
              collections?.contractedActiveValue ?? 0,
            ),
          })}
          href="/admin/bookkeeping"
        />
        <AdminStatCard
          icon="monitoring"
          iconClassName="bg-[#e8f0fe]/80 text-[#174ea6]"
          label={t("stats.monthNet")}
          value={loading ? "…" : formatIdrCompact(collections?.monthNet ?? 0)}
          hint={t("stats.monthNetHint", {
            expense: formatIdrCompact(collections?.monthExpense ?? 0),
          })}
          href="/admin/bookkeeping"
          trend={
            collections
              ? {
                  value: formatIdrCompact(Math.abs(collections.monthNet)),
                  positive: collections.monthNet >= 0,
                }
              : undefined
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="event_upcoming"
          iconClassName="bg-[#fce8e6]/80 text-[#c5221f]"
          label={t("stats.expiringSoon")}
          value={loading ? "…" : (leaseStats?.expiringSoonCount ?? 0)}
          hint={t("stats.expiringSoonHint")}
          href="/admin/leases"
        />
        <AdminStatCard
          icon="pending"
          iconClassName="bg-[#e8f0fe]/80 text-[#1967d2]"
          label={t("stats.renewalPending")}
          value={loading ? "…" : (leaseStats?.renewalPendingCount ?? 0)}
          hint={t("stats.renewalPendingHint")}
          href="/admin/lease-renewals"
        />
        <AdminStatCard
          icon="warning"
          iconClassName="bg-[#fce8e6]/80 text-[#a50e0e]"
          label={t("stats.renewalOverdue")}
          value={loading ? "…" : (leaseStats?.renewalOverdueCount ?? 0)}
          hint={t("stats.renewalOverdueHint")}
          href="/admin/lease-renewals"
        />
        <AdminStatCard
          icon="autorenew"
          iconClassName="bg-[#E6F4EA]/80 text-[#137333]"
          label={t("stats.renewalIntent")}
          value={
            loading
              ? "…"
              : t("stats.renewalIntentValue", {
                  renew: leaseStats?.renewalIntentRenew ?? 0,
                  decline: leaseStats?.renewalIntentDecline ?? 0,
                })
          }
          hint={t("stats.renewalIntentHint")}
          href="/admin/lease-renewals"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="glass-panel rounded-[1.75rem] p-5 lg:col-span-1">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#83746b]">
            {t("quickActions.title")}
          </h3>
          <ul className="mt-4 space-y-1.5">
            {quickActions.map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#51443c] transition-colors hover:bg-white/50 hover:text-[#1a1c1a]"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white/55 text-ferrugem shadow-[inset_0_1px_0_rgb(255_255_255/0.7)]">
                    <Icon name={action.icon} size={20} />
                  </span>
                  {t(action.labelKey)}
                  <Icon
                    name="chevron_right"
                    size={18}
                    className="ml-auto text-[#83746b]"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel overflow-hidden rounded-[1.75rem] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/40 px-5 py-4">
            <div>
              <h3 className="font-semibold text-[#1a1c1a]">{t("queues.title")}</h3>
              <p className="text-xs text-[#83746b]">{t("queues.subtitle")}</p>
            </div>
            <Link
              href="/admin/leases"
              className="text-sm font-semibold text-ferrugem hover:text-maroon"
            >
              {t("queues.viewAll")}
            </Link>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-[#83746b]">{t("loading")}</p>
          ) : actionQueue.length === 0 ? (
            <p className="p-6 text-sm text-[#83746b]">{t("queues.empty")}</p>
          ) : (
            <ul className="divide-y divide-white/30">
              {actionQueue.map(({ kind, lease }) => (
                <QueueRow
                  key={`${kind}-${lease.id}`}
                  kind={kind}
                  lease={lease}
                  locale={locale}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function OccupancyRing({
  percent,
  label,
  hint,
}: {
  percent: number;
  label: string;
  hint: string;
}) {
  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(255 255 255 / 0.45)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#occupancyGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="occupancyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6f4627" />
              <stop offset="55%" stopColor="#a44a32" />
              <stop offset="100%" stopColor="#5a2430" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-[#1a1c1a]">
            {percent}%
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#1a1c1a]">{label}</p>
      <p className="mt-0.5 text-xs text-[#83746b]">{hint}</p>
    </div>
  );
}

function QueueRow({
  kind,
  lease,
  locale,
}: {
  kind: "review" | "unpaidOverdue" | "renewal" | "expiring";
  lease: AdminDashboardLeaseSummary;
  locale: string;
}) {
  const t = useTranslations("admin.pages.overview.queues");
  const tenant = lease.user?.name ?? lease.user?.email ?? "—";
  const propertyName = lease.property?.name;
  const endDate = lease.endDate;

  return (
    <li>
      <Link
        href={buildViewLeaseHref(lease.id)}
        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/35"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#d3e4fe]/80 text-xs font-bold text-[#0b1c30] ring-1 ring-white/60">
          {getInitials(tenant)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[#1a1c1a]">{tenant}</p>
          <p className="truncate text-xs text-[#83746b]">
            {lease.unit?.name ?? "—"}
            {propertyName ? ` · ${propertyName}` : ""}
          </p>
          <p className="mt-0.5 text-xs font-medium text-ferrugem">
            {t(`kinds.${kind}`)}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs text-[#83746b]">
            {formatDate(lease.startDate, locale)} – {formatDate(endDate, locale)}
          </p>
          {kind === "unpaidOverdue" && (
            <p className="text-xs font-medium text-[#ba1a1a]">
              {t("daysLate", { days: lease.daysLate ?? 0 })}
            </p>
          )}
          {kind === "renewal" && lease.leaseRenewal?.confirmationDeadline && (
            <p className="text-xs font-medium text-[#ba1a1a]">
              {t("deadline", {
                date: formatDate(lease.leaseRenewal.confirmationDeadline, locale),
              })}
            </p>
          )}
          {kind === "expiring" && (
            <p className="text-xs font-medium text-[#ba1a1a]">{t("expiringSoon")}</p>
          )}
        </div>
        <LeaseStatusBadge status={lease.status} />
      </Link>
    </li>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
