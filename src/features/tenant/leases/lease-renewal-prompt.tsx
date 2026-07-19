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
        isRenewLease: true,
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
        isRenewLease: false,
      });
      dismissRenewalPrompt(renewal!.id);
      showApiSuccess(t("declinedSuccess"));
      onResponded?.();
    } catch (err) {
      showApiError(err, t("declineFailed"));
    }
  }

  /** Dismiss = real decline: record on server, then hide locally. */
  const handleDismiss = handleDecline;

  async function handleCancelRequest() {
    try {
      await mutations.updateRenewal.mutateAsync({
        leaseId: lease.id,
        isRenewLease: false,
      });
      dismissRenewalPrompt(renewal!.id);
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
          deadline: formatDate(renewal.leaseEndDate),
        })}
        action={
          !compact ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void handleCancelRequest()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#e3e2e0] bg-white px-4 py-2 text-sm font-semibold text-[#51443c] transition-colors hover:bg-[#efeeeb] disabled:opacity-50"
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
        "rounded-2xl border border-[#8b5e3c]/25 bg-gradient-to-br from-[#fef7e0] to-[#fff8ef] p-5 shadow-sm",
        compact && "p-4",
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#8b5e3c]/10 text-[#6f4627]">
          <Icon name="autorenew" size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#1a1c1a]">{t("promptTitle")}</p>
          <p className="mt-1 text-sm text-[#51443c]">
            {t("promptDescription", {
              unit: lease.unit?.name ?? "—",
              endDate: lease.endDate ? formatDate(lease.endDate) : "—",
              deadline: formatDate(renewal.leaseEndDate),
            })}
          </p>
          {!compact && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => void handleRenew()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#6f4627] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Icon name="check" size={18} />
                {pending ? t("submitting") : t("yesRenew")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void handleDismiss()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#e3e2e0] bg-white px-4 py-2 text-sm font-semibold text-[#51443c] transition-colors hover:bg-[#efeeeb] disabled:opacity-50"
              >
                {pending ? t("submitting") : t("noRenew")}
              </button>
            </div>
          )}
          {compact && (
            <Link
              href="/tenant/lease-renewals"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#6f4627] hover:underline"
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
      ? "border-[#B06000]/20 bg-[#FEF7E0]/60 text-[#B06000]"
      : "border-[#137333]/20 bg-[#E6F4EA]/60 text-[#137333]";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        toneStyles,
        compact && "p-3",
        className,
      )}
    >
      <div className="flex gap-3">
        <Icon name={icon} size={compact ? 20 : 22} className="shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#1a1c1a]">{title}</p>
          <p className="mt-0.5 text-sm text-[#51443c]">{description}</p>
          {action}
        </div>
      </div>
    </div>
  );
}
