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
import { TenantLeasePaymentSummary } from "@/features/tenant/leases/tenant-lease-payment-summary";
import { getTenantRenewalView } from "@/features/tenant/lib/lease-renewal";
import { Link } from "@/i18n/routing";
import type { LeaseAttachmentKind } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export function TenantLeaseDetail({ id }: { id: string }) {
  const t = useTranslations("tenant.common");
  const tp = useTranslations("tenant.pages.leases");
  const tn = useTranslations("tenant.nav");
  const th = useTranslations("tenant.home");
  const { data: lease, isLoading, error } = useTenantLease(id);

  if (isLoading) {
    return <p className="text-sm text-[#6b6b6b]">{t("loading")}</p>;
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
          <TenantLeasePaymentSummary lease={lease} />
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
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailItem
              label={tp("startDate")}
              value={formatDate(lease.startDate)}
            />
            <DetailItem
              label={tp("endDate")}
              value={lease.endDate ? formatDate(lease.endDate) : "—"}
            />
            {lease.unit?.property?.address ? (
              <DetailItem
                label={tp("address")}
                value={lease.unit.property.address}
                className="sm:col-span-2"
              />
            ) : null}
            {lease.unit?.property?.city ? (
              <DetailItem label={tp("city")} value={lease.unit.property.city} />
            ) : null}
          </dl>
        </AdminFormSection>

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
    <div className={cn("rounded-2xl bg-[#faf7f6] p-3.5", className)}>
      <dt className="text-xs text-[#6b6b6b]">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-medium text-[#141414]">{value}</dd>
    </div>
  );
}
