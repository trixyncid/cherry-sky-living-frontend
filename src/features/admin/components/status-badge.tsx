import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import type {
  LeaseBillingState,
  LeaseStatus,
  UnitStatus,
} from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export type LeaseRenewalStatus =
  | "not_requested"
  | "pending_confirmation"
  | "confirmed"
  | "completed";

const renewalConfig: Record<
  LeaseRenewalStatus,
  { className: string; icon: string; iconWrap: string }
> = {
  not_requested: {
    className: "bg-hover text-fg-2 ring-1 ring-inset ring-line",
    icon: "schedule",
    iconWrap: "text-fg-muted",
  },
  pending_confirmation: {
    className: "bg-warning-soft text-warning ring-1 ring-inset ring-warning/20",
    icon: "pending_actions",
    iconWrap: "text-warning",
  },
  confirmed: {
    className: "bg-success-soft text-success ring-1 ring-inset ring-success/20",
    icon: "check_circle",
    iconWrap: "text-success",
  },
  completed: {
    className: "bg-brand-soft text-brand ring-1 ring-inset ring-brand/15",
    icon: "task_alt",
    iconWrap: "text-brand",
  },
};

/** Pill + dot: colour always paired with a text label (never colour alone). */
const pill =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset";

const unitStyles: Record<UnitStatus, { pill: string; dot: string }> = {
  vacant: {
    pill: "bg-success-soft text-success ring-success/20",
    dot: "bg-success",
  },
  occupied: { pill: "bg-ink text-white ring-ink", dot: "bg-brand-bright" },
};

const leaseStyles: Record<LeaseStatus, { pill: string; dot: string }> = {
  paid: {
    pill: "bg-success-soft text-success ring-success/20",
    dot: "bg-success",
  },
  unpaid: {
    pill: "bg-danger-soft text-danger ring-danger/20",
    dot: "bg-danger",
  },
  waiting_for_review: {
    pill: "bg-warning-soft text-warning ring-warning/25",
    dot: "bg-warning",
  },
};

const leaseLabelKeys: Record<
  LeaseStatus,
  "statusPaid" | "statusUnpaid" | "statusReview"
> = {
  paid: "statusPaid",
  unpaid: "statusUnpaid",
  waiting_for_review: "statusReview",
};

export function UnitStatusBadge({ status }: { status: UnitStatus | string }) {
  const t = useTranslations("admin.pages.units.status");
  const key = status.toLowerCase() as UnitStatus;
  const style = unitStyles[key];
  return (
    <span
      className={cn(
        pill,
        "capitalize",
        style?.pill ?? "bg-hover text-fg-2 ring-line",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", style?.dot ?? "bg-fg-faint")}
        aria-hidden
      />
      {key === "vacant" || key === "occupied" ? t(key) : key}
    </span>
  );
}

export function LeaseStatusBadge({ status }: { status: LeaseStatus }) {
  const t = useTranslations("admin.pages.overview.dash");
  const style = leaseStyles[status];
  return (
    <span className={cn(pill, style.pill)}>
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      {t(leaseLabelKeys[status])}
    </span>
  );
}

export function LeaseRenewalStatusBadge({
  status,
  label,
}: {
  status: LeaseRenewalStatus;
  label: string;
}) {
  const config = renewalConfig[status];

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full py-1 pl-1.5 pr-2.5 text-xs font-medium",
        config.className,
      )}
    >
      <span
        className={cn(
          "inline-flex size-4 shrink-0 items-center justify-center",
          config.iconWrap,
        )}
      >
        <Icon name={config.icon} size={15} filled />
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}

const billingStyles: Record<LeaseBillingState, { pill: string; dot: string }> =
  {
    overdue: {
      pill: "bg-danger-soft text-danger ring-danger/20",
      dot: "bg-danger",
    },
    review: {
      pill: "bg-warning-soft text-warning ring-warning/25",
      dot: "bg-warning",
    },
    due: {
      pill: "bg-warning-soft text-warning ring-warning/25",
      dot: "bg-warning",
    },
    current: {
      pill: "bg-success-soft text-success ring-success/20",
      dot: "bg-success",
    },
    paid: { pill: "bg-ink text-white ring-ink", dot: "bg-success-bright" },
    upcoming: { pill: "bg-hover text-fg-2 ring-line", dot: "bg-fg-faint" },
  };

/** Where a tenant stands on their payment schedule today. */
export function LeaseBillingBadge({
  state,
  overdueCount,
}: {
  state: LeaseBillingState;
  overdueCount?: number;
}) {
  const t = useTranslations("admin.pages.leases.billing.state");
  const style = billingStyles[state];
  return (
    <span className={cn(pill, style.pill)}>
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      {t(state)}
      {state === "overdue" && overdueCount && overdueCount > 1
        ? ` · ${overdueCount}`
        : null}
    </span>
  );
}
