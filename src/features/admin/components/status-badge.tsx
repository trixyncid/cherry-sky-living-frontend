import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/Icon";
import type { LeaseStatus, UnitStatus } from "@/lib/types/admin";

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
    className: "bg-[#efeeeb] text-[#51443c] ring-1 ring-[#d5c3b8]/55",
    icon: "schedule",
    iconWrap: "bg-white/80 text-[#83746b]",
  },
  pending_confirmation: {
    className:
      "bg-[linear-gradient(135deg,#FFF6E5_0%,#FFE8C7_100%)] text-[#8A4B00] ring-1 ring-[#E8B86D]/55 shadow-[0_1px_0_rgb(255_255_255_/_0.7)_inset]",
    icon: "pending_actions",
    iconWrap: "bg-[#F5D9A8]/70 text-[#B06000]",
  },
  confirmed: {
    className:
      "bg-[linear-gradient(135deg,#EAF7EE_0%,#D7F0DF_100%)] text-[#0F5C2E] ring-1 ring-[#8BC9A0]/45 shadow-[0_1px_0_rgb(255_255_255_/_0.7)_inset]",
    icon: "check_circle",
    iconWrap: "bg-[#C8E6D0]/80 text-[#137333]",
  },
  completed: {
    className:
      "bg-[linear-gradient(135deg,#F3EDE7_0%,#E8DDD3_100%)] text-[#5A3820] ring-1 ring-[#D5C3B8]/70 shadow-[0_1px_0_rgb(255_255_255_/_0.7)_inset]",
    icon: "task_alt",
    iconWrap: "bg-[#E8D5C4]/80 text-[#6f4627]",
  },
};

const unitStyles: Record<UnitStatus, string> = {
  vacant: "bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-400/25",
  occupied: "bg-red-500/12 font-bold text-[#ba1a1a] ring-1 ring-red-400/25",
};

const leaseStyles: Record<LeaseStatus, string> = {
  paid: "bg-emerald-500/15 text-[#137333] ring-1 ring-emerald-400/25",
  unpaid: "bg-red-500/12 text-[#ba1a1a] ring-1 ring-red-400/25",
  waiting_for_review: "bg-amber-400/15 text-[#B06000] ring-1 ring-amber-300/30",
};

const leaseLabels: Record<LeaseStatus, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  waiting_for_review: "Waiting for Review",
};

export function UnitStatusBadge({ status }: { status: UnitStatus | string }) {
  const key = status.toLowerCase() as UnitStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize backdrop-blur-sm",
        unitStyles[key] ?? "bg-white/45 text-[#51443c] ring-1 ring-white/50",
      )}
    >
      {key}
    </span>
  );
}

export function LeaseStatusBadge({ status }: { status: LeaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
        leaseStyles[status],
      )}
    >
      {leaseLabels[status]}
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
        "inline-flex max-w-full items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs font-semibold",
        config.className,
      )}
    >
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
          config.iconWrap,
        )}
      >
        <Icon name={config.icon} size={13} filled />
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}
