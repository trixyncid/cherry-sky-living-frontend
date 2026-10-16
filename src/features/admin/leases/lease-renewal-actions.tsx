"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import {
  LeaseRenewalStatusBadge,
  type LeaseRenewalStatus,
} from "@/features/admin/components/status-badge";
import { useLeaseMutations } from "@/features/admin/hooks/use-admin-queries";
import { getLeaseEndDateValue } from "@/features/admin/lib/entity-display";
import { dayAfterDate, formatDate } from "@/features/admin/lib/format";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import type { Lease } from "@/lib/types/admin";

function resolveRenewalStatus(lease: Lease): LeaseRenewalStatus {
  const renewal = lease.leaseRenewal;
  if (!renewal?.isRenewLease) return "not_requested";
  if (renewal.markAsCompleted) return "completed";
  if (renewal.isConfirmed) return "confirmed";
  return "pending_confirmation";
}

function buildRenewalLeaseHref(lease: Lease): string {
  const renewal = lease.leaseRenewal;
  const endDate = getLeaseEndDateValue(lease);
  const params = new URLSearchParams({
    renewalId: renewal?.id ?? "",
    unitId: lease.unitId,
    userId: lease.userId,
  });
  if (endDate) {
    params.set("startDate", dayAfterDate(endDate));
  }
  return `/admin/leases/new?${params.toString()}`;
}

export function AdminLeaseRenewalActions({
  lease,
  compact = false,
}: {
  lease: Lease;
  compact?: boolean;
}) {
  const tp = useTranslations("admin.pages.leaseRenewals");
  const mutations = useLeaseMutations();
  const [confirming, setConfirming] = useState(false);
  const renewal = lease.leaseRenewal;

  if (!renewal) return null;

  const status = resolveRenewalStatus(lease);
  const canConfirm =
    renewal.isRenewLease && !renewal.isConfirmed && !renewal.markAsCompleted;
  const canCreateLease =
    renewal.isRenewLease && renewal.isConfirmed && !renewal.markAsCompleted;

  async function handleConfirm() {
    setConfirming(true);
    try {
      await mutations.confirmRenewal.mutateAsync({
        leaseId: lease.id,
        isConfirmed: true,
      });
      showApiSuccess(tp("confirmed"));
    } catch (err) {
      showApiError(err, tp("confirmFailed"));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center justify-end gap-2"
          : "rounded-xl border border-[#e3e2e0] bg-[#faf9f7] p-4"
      }
    >
      {!compact && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1a1c1a]">{tp("renewalSection")}</p>
          <LeaseRenewalStatusBadge
            status={status}
            label={tp(`status.${status}`)}
          />
        </div>
      )}

      {!compact && (
        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#83746b]">
              {tp("confirmationDeadline")}
            </dt>
            <dd className="font-medium text-[#1a1c1a]">
              {formatDate(renewal.confirmationDeadline)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#83746b]">
              {tp("leaseEnd")}
            </dt>
            <dd className="font-medium text-[#1a1c1a]">
              {lease.endDate ? formatDate(lease.endDate) : "—"}
            </dd>
          </div>
        </dl>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {canConfirm && (
          <button
            type="button"
            disabled={confirming || mutations.confirmRenewal.isPending}
            onClick={() => void handleConfirm()}
            className="inline-flex items-center gap-1 rounded-lg bg-[#71130d] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Icon name="check" size={16} />
            {confirming ? tp("confirming") : tp("confirm")}
          </button>
        )}
        {canCreateLease && (
          <Link
            href={buildRenewalLeaseHref(lease)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#71130d]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#71130d] transition-colors hover:bg-[#efeeeb]"
          >
            <Icon name="post_add" size={16} />
            {tp("createRenewalLease")}
          </Link>
        )}
        {!compact && (
          <Link
            href="/admin/lease-renewals"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#51443c] transition-colors hover:bg-[#efeeeb]"
          >
            {tp("viewAllRenewals")}
          </Link>
        )}
      </div>
    </div>
  );
}
