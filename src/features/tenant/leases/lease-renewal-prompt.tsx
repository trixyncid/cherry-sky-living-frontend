"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { formatDate } from "@/features/admin/lib/format";
import {
  clearRenewalDismissal,
  dismissRenewalPrompt,
  getTenantRenewalView,
} from "@/features/tenant/lib/lease-renewal";
import { useTenantLeaseMutations } from "@/features/tenant/hooks/use-tenant-queries";
import { cn } from "@/lib/utils";
import type { Lease } from "@/lib/types/admin";

interface LeaseRenewalPromptProps {
  lease: Lease;
  compact?: boolean;
  className?: string;
  onResponded?: () => void;
}

export function LeaseRenewalPrompt({
  lease,
  compact = false,
  className,
  onResponded,
}: LeaseRenewalPromptProps) {
  const t = useTranslations("tenant.pages.leases.renewal");
  const mutations = useTenantLeaseMutations();
  const view = getTenantRenewalView(lease);
  const renewal = lease.leaseRenewal;
  const pending = mutations.updateRenewal.isPending;

  if (view === "none" || !renewal) return null;

  async function handleRenew() {
    try {
      await mutations.updateRenewal.mutateAsync({
        leaseId: lease.id,
        action: "renew",
      });
      clearRenewalDismissal(renewal!.id);
      showApiSuccess(t("requestedSuccess"));
      onResponded?.();
    } catch (err) {
      showApiError(err, t("requestFailed"));
    }
  }

  async function handleDecline() {
    try {
      await mutations.updateRenewal.mutateAsync({
        leaseId: lease.id,
        action: "decline",
      });
      dismissRenewalPrompt(renewal!.id);
      showApiSuccess(t("declinedSuccess"));
      onResponded?.();
    } catch (err) {
      showApiError(err, t("declineFailed"));
    }
  }

  /** "No renew" records a confirmed decline on the server. */
  const handleDismiss = handleDecline;

  async function handleCancelRequest() {
    try {
      await mutations.updateRenewal.mutateAsync({
        leaseId: lease.id,
        action: "cancel",
      });
      // Return to unanswered — show the prompt again so they can re-request.
      clearRenewalDismissal(renewal!.id);
      showApiSuccess(t("cancelledSuccess"));
      onResponded?.();
    } catch (err) {
      showApiError(err, t("cancelFailed"));
    }
  }

  if (view === "requested") {
    return (
      <RenewalBanner
        className={className}
        compact={compact}
        icon="hourglass_top"
        tone="pending"
        title={t("requestedTitle")}
        description={t("requestedDescription", {
          deadline: formatDate(renewal.confirmationDeadline),
        })}
        action={
          !compact ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void handleCancelRequest()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl glass-control px-4 py-2 text-sm font-semibold text-[#3d3a36] transition-colors hover:bg-white/80 disabled:opacity-50"
            >
              {pending ? t("submitting") : t("cancelRequest")}
            </button>
          ) : undefined
        }
      />
    );
  }

  if (view === "confirmed") {
    return (
      <RenewalBanner
        className={className}
        compact={compact}
        icon="check_circle"
        tone="success"
        title={t("confirmedTitle")}
        description={t("confirmedDescription")}
      />
    );
  }

  return (
    <div
      className={cn(
        "glass-panel rounded-[1.75rem] p-5 ring-1 ring-ferrugem/20",
        compact && "p-4",
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ferrugem/12 text-ferrugem shadow-[inset_0_1px_0_rgb(255_255_255/0.55)]">
          <Icon name="autorenew" size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#141414]">{t("promptTitle")}</p>
          <p className="mt-1 text-sm text-[#3d3a36]">
            {t("promptDescription", {
              unit: lease.unit?.name ?? "—",
              endDate: lease.endDate ? formatDate(lease.endDate) : "—",
              deadline: formatDate(renewal.confirmationDeadline),
            })}
          </p>
          {!compact && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => void handleRenew()}
                className="admin-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <Icon name="check" size={18} />
                {pending ? t("submitting") : t("yesRenew")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void handleDismiss()}
                className="glass-control inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-[#3d3a36] transition-colors hover:bg-white/80 disabled:opacity-50"
              >
                {pending ? t("submitting") : t("noRenew")}
              </button>
            </div>
          )}
          {compact && (
            <Link
              href="/tenant/lease-renewals"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#71130d] hover:underline"
            >
              {t("respondNow")}
              <Icon name="arrow_forward" size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function RenewalBanner({
  icon,
  tone,
  title,
  description,
  compact,
  className,
  action,
}: {
  icon: string;
  tone: "pending" | "success";
  title: string;
  description: string;
  compact?: boolean;
  className?: string;
  action?: React.ReactNode;
}) {
  const toneStyles =
    tone === "pending"
      ? "border-[#B06000]/20 bg-[#FEF7E0]/55 text-[#B06000]"
      : "border-[#137333]/20 bg-[#E6F4EA]/55 text-[#137333]";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 backdrop-blur-md",
        toneStyles,
        compact && "p-3",
        className,
      )}
    >
      <div className="flex gap-3">
        <Icon name={icon} size={compact ? 20 : 22} className="shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#141414]">{title}</p>
          <p className="mt-0.5 text-sm text-[#3d3a36]">{description}</p>
          {action}
        </div>
      </div>
    </div>
  );
}
