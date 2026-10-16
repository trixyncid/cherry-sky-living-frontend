"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { formatDate } from "@/features/admin/lib/format";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { useTenantLease } from "@/features/tenant/hooks/use-tenant-queries";
import { TenantAttachmentsList } from "@/features/tenant/components/tenant-attachments-list";
import { LeaseRenewalPrompt } from "@/features/tenant/leases/lease-renewal-prompt";
import { TenantLeasePaymentSummary } from "@/features/tenant/leases/tenant-lease-payment-summary";
import { getTenantRenewalView } from "@/features/tenant/lib/lease-renewal";
import type { LeaseAttachmentKind } from "@/lib/types/admin";

export function TenantLeaseDetail({ id }: { id: string }) {
  const t = useTranslations("tenant.common");
  const tp = useTranslations("tenant.pages.leases");
  const { data: lease, isLoading, error } = useTenantLease(id);

  if (isLoading) {
    return (
      <p className="text-sm text-[#6b6b6b]">{t("loading")}</p>
    );
  }

  if (error || !lease) {
    return (
      <div className="space-y-4">
        <Link
          href="/tenant/leases"
          className="glass-control inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-[#71130d] transition-colors hover:bg-white"
        >
          <Icon name="arrow_back" size={18} />
          {t("backToList")}
        </Link>
        <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
      </div>
    );
  }

  const renewalView = getTenantRenewalView(lease);
  const attachments = lease.attachments ?? lease.downpaymentAttachments ?? [];

  function kindLabel(kind: LeaseAttachmentKind): string {
    if (kind === "agreement") return tp("kindAgreement");
    if (kind === "payment") return tp("kindPayment");
    return tp("kindDownpayment");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/tenant/leases"
        className="glass-control inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-[#71130d] transition-colors hover:bg-white"
      >
        <Icon name="arrow_back" size={18} />
        {t("backToList")}
      </Link>

      {renewalView !== "none" && (
        <LeaseRenewalPrompt lease={lease} />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 px-1">
        <div>
          <h2 className="text-xl font-semibold text-[#141414]">
            {lease.unit?.name ?? "—"}
          </h2>
          <p className="mt-1 text-sm text-[#3d3a36]">
            {lease.unit?.property?.name ?? "—"}
            {lease.unit?.unitType?.name
              ? ` · ${lease.unit.unitType.name}`
              : ""}
          </p>
        </div>
        <LeaseStatusBadge status={lease.status} />
      </div>

      <TenantLeasePaymentSummary lease={lease} />

      <div className="glass-panel rounded-[1.75rem] p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium tracking-tight text-[#141414]">
            {tp("detailsTitle")}
          </h3>
          <p className="mt-1 text-sm text-[#6b6b6b]">
            {tp("detailsDescription")}
          </p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={tp("startDate")} value={formatDate(lease.startDate)} />
          <DetailItem
            label={tp("endDate")}
            value={lease.endDate ? formatDate(lease.endDate) : "—"}
          />
          {lease.unit?.property?.address && (
            <DetailItem
              label={tp("address")}
              value={lease.unit.property.address}
              className="sm:col-span-2"
            />
          )}
          {lease.unit?.property?.city && (
            <DetailItem label={tp("city")} value={lease.unit.property.city} />
          )}
        </dl>
      </div>

      <div className="glass-panel rounded-[1.75rem] p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium tracking-tight text-[#141414]">
            {tp("documentsTitle")}
          </h3>
          <p className="mt-1 text-sm text-[#6b6b6b]">
            {tp("documentsDescription")}
          </p>
        </div>
        <TenantAttachmentsList
          attachments={attachments.map((a) => ({
            ...a,
            kindLabel: kindLabel(a.kind),
          }))}
        />
      </div>
    </div>
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
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[#141414]">{value}</dd>
    </div>
  );
}
