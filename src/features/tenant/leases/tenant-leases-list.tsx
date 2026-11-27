"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminSearchInput } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import {
  EmptyPanel,
  panel,
  rupiah,
  SkeletonCards,
} from "@/features/admin/inventory/inventory-kit";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate } from "@/features/admin/lib/format";
import { DueChip, TermProgress } from "@/features/admin/operations/ops-kit";
import { useTenantLeases } from "@/features/tenant/hooks/use-tenant-queries";
import { LeaseRenewalPrompt } from "@/features/tenant/leases/lease-renewal-prompt";
import { getTenantRenewalView } from "@/features/tenant/lib/lease-renewal";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const BASE = "/tenant/leases";

/** My leases — one card per lease, current first, with time left and status. */
export function TenantLeasesList() {
  const t = useTranslations("tenant.common");
  const tp = useTranslations("tenant.pages.leases");
  const th = useTranslations("tenant.home");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error } = useTenantLeases();

  const today = new Date().toISOString().slice(0, 10);
  const leases = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...data]
      .filter(
        (lease) =>
          !q ||
          [
            lease.unit?.name ?? "",
            lease.unit?.property?.name ?? "",
            lease.unit?.unitType?.name ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [data, search]);

  const renewalNotices = useMemo(
    () => data.filter((lease) => getTenantRenewalView(lease) !== "none"),
    [data],
  );

  return (
    <>
      <AdminPageHeader title={tp("title")} description={tp("description")} />

      {renewalNotices.length > 0 ? (
        <div className="mb-5 space-y-3">
          {renewalNotices.map((lease) => (
            <LeaseRenewalPrompt key={lease.id} lease={lease} compact />
          ))}
        </div>
      ) : null}

      {data.length > 3 ? (
        <div className="mb-5">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder={tp("searchPlaceholder")}
            className="w-full sm:max-w-md"
          />
        </div>
      ) : null}

      {error ? (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      ) : null}

      {isLoading ? (
        <SkeletonCards count={2} className="md:grid-cols-2" />
      ) : leases.length === 0 ? (
        <EmptyPanel icon="description" title={tp("empty")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {leases.map((lease) => {
            const start = lease.startDate.slice(0, 10);
            const end = lease.endDate?.slice(0, 10) ?? "";
            const phase =
              start > today
                ? "upcoming"
                : end && end < today
                  ? "past"
                  : "current";
            return (
              <Link
                key={lease.id}
                href={`${BASE}/${lease.id}`}
                className={cn(
                  panel,
                  "group flex flex-col gap-4 p-5 transition-colors",
                  phase === "current" && "ring-2 ring-brand-line",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                        phase === "current"
                          ? "bg-brand text-white"
                          : "bg-subtle text-brand",
                      )}
                    >
                      <Icon name="bed" size={22} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-medium tracking-tight text-fg">
                        {th("roomLine", { unit: lease.unit?.name ?? "—" })}
                      </p>
                      <p className="truncate text-sm text-fg-muted">
                        {lease.unit?.property?.name ?? "—"}
                        {lease.unit?.unitType?.name
                          ? ` · ${lease.unit.unitType.name}`
                          : ""}
                      </p>
                      {(lease.occupants?.length ?? 0) > 0 ? (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-brand">
                          <Icon name="group" size={12} />
                          {lease.isPrimaryTenant === false
                            ? tp("residents.sharedWithPrimary", {
                                name: lease.user?.name ?? "—",
                              })
                            : tp("residents.sharedCount", {
                                count: lease.occupants?.length ?? 0,
                              })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-fg-2">
                    {th(`phase.${phase}`)}
                  </span>
                </div>

                <div>
                  {lease.endDate ? (
                    <TermProgress start={lease.startDate} end={lease.endDate} />
                  ) : null}
                  <div className="mt-1.5 flex justify-between text-sm text-fg-muted">
                    <span>{formatDate(lease.startDate, locale)}</span>
                    <span>
                      {lease.endDate ? formatDate(lease.endDate, locale) : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <LeaseStatusBadge status={lease.status} />
                    {phase === "current" && lease.endDate ? (
                      <DueChip date={lease.endDate} warnWithin={30} />
                    ) : null}
                  </div>
                  <span className="flex items-center gap-2 text-[15px] font-medium tabular-nums text-fg">
                    <span>
                      {rupiah(lease.unitPricing?.price ?? lease.amountDue ?? 0)}
                      {lease.unitPricing?.price ? (
                        <span className="text-xs font-normal text-fg-muted">
                          {t("perMonth")}
                        </span>
                      ) : null}
                    </span>
                    <Icon
                      name="arrow_forward"
                      size={18}
                      className="text-brand transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
