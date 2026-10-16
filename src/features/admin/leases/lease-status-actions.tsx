"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { useLeaseMutations } from "@/features/admin/hooks/use-admin-queries";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import type { Lease, LeaseStatus } from "@/lib/types/admin";

function hasPaymentAttachment(lease: Lease): boolean {
  const attachments = lease.attachments ?? lease.downpaymentAttachments ?? [];
  return attachments.some((attachment) => attachment.kind === "payment");
}

export function AdminLeaseStatusActions({ lease }: { lease: Lease }) {
  const tp = useTranslations("admin.pages.leases");
  const mutations = useLeaseMutations();
  const pending =
    mutations.confirmPayment.isPending ||
    mutations.rejectPayment.isPending ||
    mutations.submitForReview.isPending;

  const canConfirm =
    (lease.status === "unpaid" || lease.status === "waiting_for_review") &&
    hasPaymentAttachment(lease);
  const canSubmitForReview =
    lease.status === "unpaid" || lease.status === "paid";
  const canReject =
    lease.status === "waiting_for_review" || lease.status === "paid";

  async function run(
    action: "confirm" | "reject" | "review",
    successKey: "statusConfirmed" | "statusRejected" | "statusSubmittedForReview",
  ) {
    try {
      if (action === "confirm") {
        await mutations.confirmPayment.mutateAsync(lease.id);
      } else if (action === "reject") {
        await mutations.rejectPayment.mutateAsync(lease.id);
      } else {
        await mutations.submitForReview.mutateAsync(lease.id);
      }
      showApiSuccess(tp(successKey));
    } catch (err) {
      showApiError(err, tp("statusUpdateFailed"));
    }
  }

  return (
    <div className="rounded-xl border border-[#e3e2e0] bg-[#faf9f7] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#1a1c1a]">{tp("paymentStatus")}</p>
        <LeaseStatusBadge status={lease.status as LeaseStatus} />
      </div>
      <p className="mb-3 text-xs leading-relaxed text-[#83746b]">
        {tp("paymentStatusHint")}
      </p>
      {lease.status !== "paid" && !hasPaymentAttachment(lease) ? (
        <p className="mb-3 text-xs text-[#B06000]">{tp("confirmNeedsPayment")}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {canSubmitForReview ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void run("review", "statusSubmittedForReview")}
            className="inline-flex items-center gap-1 rounded-lg border border-[#71130d]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#71130d] transition-colors hover:bg-[#efeeeb] disabled:opacity-50"
          >
            <Icon name="rate_review" size={16} />
            {tp("markWaitingForReview")}
          </button>
        ) : null}
        {canConfirm ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void run("confirm", "statusConfirmed")}
            className="inline-flex items-center gap-1 rounded-lg bg-[#71130d] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Icon name="check" size={16} />
            {tp("confirmPaid")}
          </button>
        ) : null}
        {canReject ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void run("reject", "statusRejected")}
            className="inline-flex items-center gap-1 rounded-lg border border-[#ba1a1a]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#ba1a1a] transition-colors hover:bg-[#fff5f5] disabled:opacity-50"
          >
            <Icon name="close" size={16} />
            {tp("rejectToUnpaid")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
