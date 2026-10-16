"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { Photo, panel, rupiah } from "@/features/admin/inventory/inventory-kit";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate, formatIdrTable } from "@/features/admin/lib/format";
import { daysUntil, TermProgress } from "@/features/admin/operations/ops-kit";
import { useIsClient } from "@/features/admin/overview/use-is-client";
import { useTenantShell } from "@/features/tenant/components/tenant-shell-context";
import { useTenantLeases } from "@/features/tenant/hooks/use-tenant-queries";
import { LeaseRenewalPrompt } from "@/features/tenant/leases/lease-renewal-prompt";
import { getTenantRenewalView } from "@/features/tenant/lib/lease-renewal";
import { Link } from "@/i18n/routing";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { useKosts } from "@/lib/hooks/use-kost-data";
import type { Lease } from "@/lib/types/admin";
import { cn } from "@/lib/utils";
import { generateWhatsAppURL } from "@/lib/utils/format";

type Phase = "current" | "upcoming" | "past";

function phaseOf(lease: Lease, today: string): Phase {
  const start = lease.startDate.slice(0, 10);
  const end = (lease.endDate ?? "").slice(0, 10);
  if (start > today) return "upcoming";
  if (end && end < today) return "past";
  return "current";
}

function greetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

/**
 * Tenant home — everything a resident checks most: where they live, what
 * they owe (and a one-tap WhatsApp to send proof), how long is left on the
 * lease, renewal decisions, and their lease history.
 */
export function TenantHome() {
  const t = useTranslations("tenant.home");
  const tc = useTranslations("tenant.common");
  const locale = useLocale();
  const isClient = useIsClient();
  const { user } = useTenantShell();
  const { data: leases = [], isLoading, error } = useTenantLeases();
  const { data: kosts = [] } = useKosts();

  const { focus, history } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const tagged = leases
      .map((l) => ({ lease: l, phase: phaseOf(l, today) }))
      .sort((a, b) => b.lease.startDate.localeCompare(a.lease.startDate));
    const current = tagged.find((x) => x.phase === "current");
    const upcoming = [...tagged].reverse().find((x) => x.phase === "upcoming");
    return { focus: current ?? upcoming ?? tagged[0] ?? null, history: tagged };
  }, [leases]);

  const lease = focus?.lease;
  const property = lease?.property ?? lease?.unit?.property;
  const kost = kosts.find((k) => k.id === lease?.propertyId);
  const firstName = user.name.split(" ")[0] || user.name;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className={cn(panel, "h-56 animate-pulse bg-white/70")} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className={cn(panel, "h-48 animate-pulse bg-white/70")} />
          <div className={cn(panel, "h-48 animate-pulse bg-white/70")} />
        </div>
      </div>
    );
  }

  if (error)
    return <AdminAlert message={getErrorMessage(error, tc("loadFailed"))} />;

  if (!lease) {
    return (
      <div
        className={cn(
          panel,
          "flex flex-col items-center gap-3 px-6 py-16 text-center",
        )}
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-[#f3dedb] text-[#71130d]">
          <Icon name="key" size={30} />
        </span>
        <h1 className="text-2xl font-medium tracking-tight">
          {t("greeting", {
            greeting: t(`greet.${isClient ? greetingKey() : "morning"}`),
            name: firstName,
          })}
        </h1>
        <p className="text-lg font-medium text-[#141414]">{t("noLease")}</p>
        <p className="max-w-md text-[15px] text-[#6b6b6b]">
          {t("noLeaseHint")}
        </p>
        <a
          href={generateWhatsAppURL(getContactWhatsAppNumber())}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-[15px] font-medium text-white"
        >
          <Icon name="whatsapp" size={18} />
          {t("contactManagement")}
        </a>
      </div>
    );
  }

  const unitName = lease.unit?.name ?? "—";
  const propertyName = property?.name ?? "—";
  const address = [property?.address, property?.city]
    .filter(Boolean)
    .join(", ");
  const coords = kost?.location.coordinates;
  const mapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${propertyName}, ${address}`)}`
      : null;

  // Payment
  const status = lease.status;
  const late = status === "paid" ? 0 : Math.max(0, lease.daysLate ?? 0);
  const lateFee = status === "paid" ? 0 : Math.max(0, lease.lateFeeAmount ?? 0);
  const totalDue = (lease.amountDue ?? 0) + lateFee;
  const waIntro = { name: user.name, unit: unitName, property: propertyName };
  const proofUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    t("waProof", { ...waIntro, amount: `Rp ${formatIdrTable(totalDue)}` }),
  );
  const helloUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    t("waHello", waIntro),
  );

  // Lease time
  const end = lease.endDate;
  const left = end ? daysUntil(end) : null;
  const startsIn =
    focus?.phase === "upcoming" ? daysUntil(lease.startDate) : null;
  const showRenewal = getTenantRenewalView(lease) !== "none";

  return (
    <div className="space-y-4">
      {/* Hero: where you live */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#1c0b0a] text-white">
        <Photo
          src={kost?.thumbnail}
          alt=""
          sizes="(min-width: 1024px) 1200px, 100vw"
          className="absolute inset-0 h-full w-full opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(28_11_10/0.95)_0%,rgb(28_11_10/0.75)_45%,rgb(28_11_10/0.25)_100%)]" />
        <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm text-white/70" suppressHydrationWarning>
              {t("greeting", {
                greeting: t(`greet.${isClient ? greetingKey() : "morning"}`),
                name: firstName,
              })}
            </p>
            <h1 className="mt-2 text-[clamp(1.75rem,3.2vw,2.6rem)] font-medium leading-[1.08] tracking-[-0.03em]">
              {t("roomLine", { unit: unitName })}
              <span className="block text-white/60">{propertyName}</span>
            </h1>
            {address ? (
              <p className="mt-3 flex items-start gap-1.5 text-[15px] text-white/80">
                <Icon
                  name="location_on"
                  size={18}
                  className="mt-0.5 shrink-0"
                />
                {address}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {lease.unit?.unitType?.name ? (
              <span className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 text-sm backdrop-blur-md">
                <Icon name="bed" size={16} />
                {lease.unit.unitType.name}
              </span>
            ) : null}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-[#71130d] hover:bg-[#f3dedb]"
              >
                <Icon name="directions" size={16} />
                {t("directions")}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {showRenewal ? <LeaseRenewalPrompt lease={lease} /> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Payment */}
        <section className={cn(panel, "flex flex-col gap-4 p-5 sm:p-6")}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-medium tracking-tight">
              {t("payment")}
            </h2>
            <LeaseStatusBadge status={status} />
          </div>
          {status === "paid" ? (
            <div className="flex items-center gap-4 rounded-2xl bg-[#eef8ec] p-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#dff3d6] text-[#2f6d22]">
                <Icon name="verified" size={26} />
              </span>
              <div>
                <p className="text-lg font-medium text-[#1f5a2a]">
                  {t("paid")}
                </p>
                <p className="text-sm text-[#3d3a36]">{t("paidHint")}</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm text-[#6b6b6b]">
                  {status === "waiting_for_review"
                    ? t("reviewLabel")
                    : t("dueLabel")}
                </p>
                <p className="mt-1 text-[clamp(1.9rem,3vw,2.4rem)] font-medium leading-none tracking-[-0.03em] tabular-nums">
                  Rp {formatIdrTable(totalDue)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {lease.paymentDueDate ? (
                    <span className="rounded-full bg-[#f6f0ef] px-3 py-1 text-[#3d3a36]">
                      {t("dueBy", {
                        date: formatDate(lease.paymentDueDate, locale),
                      })}
                    </span>
                  ) : null}
                  {late > 0 ? (
                    <span className="rounded-full bg-[#fde2df] px-3 py-1 font-medium text-[#a1271b]">
                      {t("lateBy", { count: late })}
                    </span>
                  ) : null}
                  {lateFee > 0 ? (
                    <span className="rounded-full bg-[#fde2df] px-3 py-1 text-[#a1271b]">
                      {t("lateFee", { amount: rupiah(lateFee) })}
                    </span>
                  ) : null}
                </div>
              </div>
              {status === "waiting_for_review" ? (
                <p className="flex items-center gap-2 rounded-2xl bg-[#f9e3c8]/60 p-4 text-[15px] text-[#8a5a2b]">
                  <Icon name="hourglass_top" size={20} />
                  {t("reviewHint")}
                </p>
              ) : (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  <Icon name="whatsapp" size={20} />
                  {t("sendProof")}
                </a>
              )}
            </>
          )}
          <p className="mt-auto text-sm text-[#6b6b6b]">
            {t("monthlyRent")}:{" "}
            <span className="font-medium text-[#141414]">
              {rupiah(lease.unitPricing?.price ?? lease.amountDue ?? 0)}
            </span>
          </p>
        </section>

        {/* Lease time */}
        <section className={cn(panel, "flex flex-col gap-4 p-5 sm:p-6")}>
          <h2 className="text-lg font-medium tracking-tight">
            {t("leaseTime")}
          </h2>
          <div className="flex items-end gap-3">
            <p className="text-[clamp(2.4rem,4vw,3.2rem)] font-medium leading-none tracking-[-0.04em] tabular-nums text-[#71130d]">
              {startsIn !== null
                ? startsIn
                : left !== null
                  ? Math.max(0, left)
                  : "—"}
            </p>
            <p className="pb-1 text-[15px] text-[#3d3a36]">
              {startsIn !== null
                ? t("daysUntilStart")
                : left !== null && left < 0
                  ? t("ended")
                  : t("daysLeft")}
            </p>
          </div>
          {end ? (
            <TermProgress start={lease.startDate} end={end} className="h-2" />
          ) : null}
          <div className="flex justify-between text-sm text-[#6b6b6b]">
            <span>{formatDate(lease.startDate, locale)}</span>
            <span>{end ? formatDate(end, locale) : "—"}</span>
          </div>
          <div className="mt-auto grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <Link
              href={`/tenant/leases/${lease.id}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#71130d] px-4 text-[15px] font-medium text-white hover:bg-[#8a1a12]"
            >
              <Icon name="description" size={18} />
              {t("viewLease")}
            </Link>
            <a
              href={helloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#ece4e2] bg-white px-4 text-[15px] font-medium text-[#141414] hover:border-[#e8bfb9] hover:text-[#71130d]"
            >
              <Icon name="chat" size={18} />
              {t("contactManagement")}
            </a>
          </div>
        </section>
      </div>

      {/* Quick links */}
      <section className="hidden grid-cols-4 gap-3 lg:grid">
        {(
          [
            ["description", "/tenant/leases", "myLeases"],
            ["autorenew", "/tenant/lease-renewals", "renewals"],
            ["folder_open", `/tenant/leases/${lease.id}`, "documents"],
            ["person", "/tenant/profile", "profile"],
          ] as const
        ).map(([icon, href, key]) => (
          <Link
            key={key}
            href={href}
            className={cn(
              panel,
              "group flex items-center gap-3 p-4 transition-shadow hover:shadow-[0_14px_30px_-18px_rgb(28_11_10/0.35)]",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f6f0ef] text-[#71130d] transition-colors group-hover:bg-[#71130d] group-hover:text-white">
              <Icon name={icon} size={20} />
            </span>
            <span className="text-[15px] font-medium text-[#141414]">
              {t(`quick.${key}`)}
            </span>
          </Link>
        ))}
      </section>

      {/* History */}
      {history.length > 1 ? (
        <section className={cn(panel, "p-5 sm:p-6")}>
          <h2 className="mb-4 text-lg font-medium tracking-tight">
            {t("history")}
          </h2>
          <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[0.6rem] before:top-3 before:w-px before:bg-[#ece4e2]">
            {history.map(({ lease: l, phase }) => (
              <li key={l.id} className="relative flex items-start gap-4 pl-8">
                <span
                  className={cn(
                    "absolute left-0 top-1.5 size-5 rounded-full border-4 border-white",
                    phase === "current"
                      ? "bg-[#71130d]"
                      : phase === "upcoming"
                        ? "bg-[#e8bfb9]"
                        : "bg-[#d6ccc9]",
                  )}
                />
                <Link
                  href={`/tenant/leases/${l.id}`}
                  className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#faf7f6] px-4 py-3 hover:bg-[#f6f0ef]"
                >
                  <span>
                    <span className="block text-[15px] font-medium">
                      {l.unit?.name ?? "—"} ·{" "}
                      {(l.property ?? l.unit?.property)?.name ?? ""}
                    </span>
                    <span className="block text-sm text-[#6b6b6b]">
                      {formatDate(l.startDate, locale)} →{" "}
                      {l.endDate ? formatDate(l.endDate, locale) : "—"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-[#3d3a36]">
                      {t(`phase.${phase}`)}
                    </span>
                    <LeaseStatusBadge status={l.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
