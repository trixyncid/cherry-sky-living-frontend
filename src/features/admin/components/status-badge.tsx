import { cn } from "@/lib/utils";
import type { LeaseStatus, UnitStatus } from "@/lib/types/admin";

export type LeaseRenewalStatus =
  | "not_requested"
  | "pending_confirmation"
  | "confirmed"
  | "completed";

const renewalStyles: Record<LeaseRenewalStatus, string> = {
  not_requested: "bg-white/45 text-[#51443c] ring-1 ring-white/50",
  pending_confirmation: "bg-amber-400/15 text-[#B06000] ring-1 ring-amber-300/30",
  confirmed: "bg-emerald-500/15 text-[#137333] ring-1 ring-emerald-400/25",
  completed: "bg-blue-500/12 text-blue-800 ring-1 ring-blue-400/25",
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
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
        renewalStyles[status],
      )}
    >
      {label}
    </span>
  );
}
