"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import {
  AdminDetailPage,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate } from "@/features/admin/lib/format";
import { TermProgress } from "@/features/admin/operations/ops-kit";
import { TenantAttachmentsList } from "@/features/tenant/components/tenant-attachments-list";
import { useTenantLease } from "@/features/tenant/hooks/use-tenant-queries";
import { LeaseRenewalPrompt } from "@/features/tenant/leases/lease-renewal-prompt";
import { TenantLeaseInspection } from "@/features/tenant/leases/tenant-lease-inspection";
import { TenantLeasePaymentSummary } from "@/features/tenant/leases/tenant-lease-payment-summary";
import {
  getTenantRenewalView,
  isRoommateView,
} from "@/features/tenant/lib/lease-renewal";
import { Link } from "@/i18n/routing";
import { leaseResidents } from "@/lib/lease-occupants";
import type { LeaseAttachmentKind } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export function TenantLeaseDetail({ id }: { id: string }) {
  const t = useTranslations("tenant.common");
  const tp = useTranslations("tenant.pages.leases");
  const tn = useTranslations("tenant.nav");
  const th = useTranslations("tenant.home");
  const tr = useTranslations("tenant.pages.leases.residents");
  const { data: lease, isLoading, error } = useTenantLease(id);

  if (isLoading) {
    return <p className="text-sm text-fg-muted">{t("loading")}</p>;
  }

  if (error || !lease) {
    return (
      <div className="space-y-4">
        <Link
          href="/tenant/leases"
          className="glass-control inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-medium text-brand transition-colors hover:bg-white"
        >
          <Icon name="arrow_back" size={18} />
          {t("backToList")}
        </Link>
        <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
      </div>
    );
  }

  const renewalView = getTenantRenewalView(lease);
  const residents = leaseResidents(lease);
  const roommateView = isRoommateView(lease);
  // Inspection files have their own section below.
  const attachments = (
    lease.attachments ??
    lease.downpaymentAttachments ??
    []
  ).filter((a) => a.kind !== "inspection");

  function kindLabel(kind: LeaseAttachmentKind): string {
    if (kind === "agreement") return tp("kindAgreement");
    if (kind === "payment") return tp("kindPayment");
    if (kind === "inspection") return tp("kindInspection");
    return tp("kindDownpayment");
  }

  return (
    <AdminDetailPage
      backHref="/tenant/leases"
      backLabel={t("backToList")}
      section={tn("leases")}
      mode="view"
      title={th("roomLine", { unit: lease.unit?.name ?? "—" })}
      description={[lease.unit?.property?.name, lease.unit?.unitType?.name]
        .filter(Boolean)
        .join(" · ")}
      aside={
        <>
          <div className="flex justify-end">
            <LeaseStatusBadge status={lease.status} />
          </div>
          {roommateView ? (
            <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-subtle px-4 py-3 text-sm text-fg-2">
              <Icon
                name="group"
                size={18}
                className="mt-0.5 shrink-0 text-brand"
              />
              <p>{tr("roommateNotice", { name: lease.user?.name ?? "—" })}</p>
            </div>
          ) : null}
          {/* Bills and documents belong to the primary tenant. */}
          {roommateView ? null : <TenantLeasePaymentSummary lease={lease} />}
        </>
      }
    >
      <div className="space-y-6">
        {renewalView !== "none" ? <LeaseRenewalPrompt lease={lease} /> : null}

        <AdminFormSection
          icon="event"
          title={tp("detailsTitle")}
          hint={tp("detailsDescription")}
        >
          {lease.endDate ? (
            <TermProgress
              start={lease.startDate}
              end={lease.endDate}
              className="mb-4 h-2"
            />
          ) : null}
          <dl className="grid grid-cols-2 gap-3">
            <DetailItem
              label={tp("startDate")}
              value={formatDate(lease.startDate)}
            />
            <DetailItem
              label={tp("endDate")}
              value={lease.endDate ? formatDate(lease.endDate) : "—"}
            />
            {lease.unit?.property?.address || lease.unit?.property?.city ? (
              // One address line instead of separate "Alamat" and "Kota" boxes.
              <DetailItem
                label={tp("address")}
                value={[
                  lease.unit?.property?.address,
                  lease.unit?.property?.city,
                ]
                  .filter(Boolean)
                  .join(", ")}
                className="col-span-2"
              />
            ) : null}
          </dl>
        </AdminFormSection>

        {residents.length > 1 ? (
          <AdminFormSection icon="group" title={tr("title")} hint={tr("hint")}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {residents.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center gap-3 rounded-2xl bg-subtle p-3.5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-brand">
                    {person.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-fg">
                      {person.name}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {person.isPrimary ? tr("primary") : tr("roommate")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </AdminFormSection>
        ) : null}

        <AdminFormSection
          icon="fact_check"
          title={tp("inspection.title")}
          hint={tp("inspection.hint")}
        >
          <TenantLeaseInspection lease={lease} />
        </AdminFormSection>

        {roommateView ? null : (
          <AdminFormSection
            icon="folder_open"
            title={tp("documentsTitle")}
            hint={tp("documentsDescription")}
          >
            <TenantAttachmentsList
              attachments={attachments.map((a) => ({
                ...a,
                kindLabel: kindLabel(a.kind),
              }))}
            />
          </AdminFormSection>
        )}
      </div>
    </AdminDetailPage>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-subtle p-3.5", className)}>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-medium text-fg">{value}</dd>
    </div>
  );
}
