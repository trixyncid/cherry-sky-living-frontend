"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import {
  useLeases,
  useProperties,
  useUnitPricings,
  useUnits,
} from "@/features/admin/hooks/use-admin-queries";
import {
  useAdminLookups,
  type AdminLookups,
} from "@/features/admin/hooks/use-admin-lookups";
import {
  getLeaseEndDateValue,
  resolveLeasePropertyName,
  resolveLeaseTenantLabel,
} from "@/features/admin/lib/entity-display";
import {
  formatDate,
  formatIdrCompact,
  getInitials,
  isExpiringWithinDays,
} from "@/features/admin/lib/format";
import { isUnitOccupied, type Lease } from "@/lib/types/admin";

const EXPIRING_SOON_DAYS = 5;

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

  const properties = useProperties();
  const units = useUnits();
  const pricings = useUnitPricings();
  const leases = useLeases();

  const loading =
    properties.isLoading ||
    units.isLoading ||
    pricings.isLoading ||
    leases.isLoading;

  const loadError =
    properties.error ?? units.error ?? pricings.error ?? leases.error;

  const leaseList = leases.data ?? [];
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const unitList = units.data ?? [];

  const metrics = useMemo(() => {
    const occupied = unitList.filter((u) => isUnitOccupied(u.status)).length;
    const totalUnits = unitList.length;
    const occupancy =
      totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;
    const activeLeases = leaseList.filter((l) => {
      if (l.status !== "paid") return false;
      const end = getLeaseEndDateValue(l);
      if (!end) return true;
      return new Date(end) >= today;
    }).length;
    const expiring = leaseList.filter((l) => {
      const end = getLeaseEndDateValue(l);
      return end != null && isExpiringWithinDays(end, EXPIRING_SOON_DAYS);
    }).length;
    const collected = leaseList
      .filter((l) => {
        if (l.status !== "paid") return false;
        const end = getLeaseEndDateValue(l);
        if (!end) return true;
        return new Date(end) >= today;
      })
      .reduce((sum, l) => sum + (l.unitPricing?.price ?? 0), 0);

    return { occupied, totalUnits, occupancy, activeLeases, expiring, collected };
  }, [leaseList, unitList, today]);

  const recentLeases = useMemo(
    () =>
      [...leaseList]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [leaseList],
  );

  const lookups = useAdminLookups();
  const greetingKey = getGreeting();
  const todayLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-8">
      {loadError && <AdminAlert message={tc("loadFailed")} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="glass-panel relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8 lg:col-span-2">
          <div
            className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-[#8b5e3c]/18 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 left-10 size-56 rounded-full bg-[#d4af37]/16 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b5e3c]">
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
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(111_70_39/0.12),transparent_60%)]"
            aria-hidden
          />
          <OccupancyRing
            percent={loading ? 0 : metrics.occupancy}
            label={t("occupancy")}
            hint={t("occupancyHint", {
              occupied: metrics.occupied,
              total: metrics.totalUnits,
            })}
          />
        </section>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="domain"
          iconClassName="bg-[#d3e4fe]/80 text-[#0b1c30]"
          label={t("stats.properties")}
          value={loading ? "…" : (properties.data?.length ?? 0)}
          hint={t("stats.propertiesHint")}
          href="/admin/properties"
        />
        <AdminStatCard
          icon="bed"
          iconClassName="bg-[#e2dfde]/80 text-[#636262]"
          label={t("stats.units")}
          value={loading ? "…" : metrics.totalUnits}
          hint={t("stats.unitsHint", { occupied: metrics.occupied })}
          href="/admin/units"
          trend={
            metrics.totalUnits > 0
              ? {
                  value: `${metrics.occupancy}%`,
                  positive: metrics.occupancy >= 50,
                }
              : undefined
          }
        />
        <AdminStatCard
          icon="description"
          iconClassName="bg-[#ffdcc5]/80 text-[#653d1e]"
          label={t("stats.leases")}
          value={loading ? "…" : metrics.activeLeases}
          hint={t("stats.leasesHint", { expiring: metrics.expiring })}
          href="/admin/leases"
        />
        <AdminStatCard
          icon="payments"
          iconClassName="bg-[#E6F4EA]/80 text-[#137333]"
          label={t("stats.revenue")}
          value={loading ? "…" : formatIdrCompact(metrics.collected)}
          hint={t("stats.revenueHint")}
          href="/admin/pricing"
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
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white/55 text-[#6f4627] shadow-[inset_0_1px_0_rgb(255_255_255/0.7)]">
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
              <h3 className="font-semibold text-[#1a1c1a]">{t("recent.title")}</h3>
              <p className="text-xs text-[#83746b]">{t("recent.subtitle")}</p>
            </div>
            <Link
              href="/admin/leases"
              className="text-sm font-semibold text-[#6f4627] hover:text-[#805533]"
            >
              {t("recent.viewAll")}
            </Link>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-[#83746b]">{t("loading")}</p>
          ) : recentLeases.length === 0 ? (
            <p className="p-6 text-sm text-[#83746b]">{t("recent.empty")}</p>
          ) : (
            <ul className="divide-y divide-white/30">
              {recentLeases.map((lease) => (
                <RecentLeaseRow
                  key={lease.id}
                  lease={lease}
                  locale={locale}
                  lookups={lookups}
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
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

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
              <stop offset="0%" stopColor="#8b5e3c" />
              <stop offset="100%" stopColor="#d4af37" />
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

function RecentLeaseRow({
  lease,
  locale,
  lookups,
}: {
  lease: Lease;
  locale: string;
  lookups: AdminLookups;
}) {
  const t = useTranslations("admin.pages.overview.recent");
  const tenant = resolveLeaseTenantLabel(lease);
  const endDate = getLeaseEndDateValue(lease);
  const propertyName = resolveLeasePropertyName(lease, lookups);
  const expiring =
    !!endDate && isExpiringWithinDays(endDate, EXPIRING_SOON_DAYS);

  return (
    <li className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/35">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#d3e4fe]/80 text-xs font-bold text-[#0b1c30] ring-1 ring-white/60">
        {getInitials(tenant)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[#1a1c1a]">{tenant}</p>
        <p className="truncate text-xs text-[#83746b]">
          {lease.unit?.name ?? lease.unitId}
          {propertyName !== "—" ? ` · ${propertyName}` : ""}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-xs text-[#83746b]">
          {formatDate(lease.startDate, locale)} –{" "}
          {endDate ? formatDate(endDate, locale) : "—"}
        </p>
        {expiring && (
          <p className="text-xs font-medium text-[#ba1a1a]">{t("expiringSoon")}</p>
        )}
      </div>
      <LeaseStatusBadge status={lease.status} />
    </li>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
