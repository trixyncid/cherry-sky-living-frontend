import type { Lease, LeaseRenewal } from "@/lib/types/admin";

const DISMISS_PREFIX = "tenant-renewal-dismissed:";

export type TenantRenewalView =
  | "none"
  | "prompt"
  | "requested"
  | "confirmed"
  | "completed";

export function canRequestLeaseRenewal(lease: Lease): boolean {
  return (
    lease.status === "paid" &&
    lease.leaseRenewal != null &&
    !lease.leaseRenewal.markAsCompleted
  );
}

export function isRenewalDismissed(renewalId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${DISMISS_PREFIX}${renewalId}`) === "1";
}

export function dismissRenewalPrompt(renewalId: string): void {
  localStorage.setItem(`${DISMISS_PREFIX}${renewalId}`, "1");
}

export function clearRenewalDismissal(renewalId: string): void {
  localStorage.removeItem(`${DISMISS_PREFIX}${renewalId}`);
}

export function getTenantRenewalView(lease: Lease): TenantRenewalView {
  const renewal = lease.leaseRenewal;
  if (!renewal || renewal.markAsCompleted) return "none";
  if (renewal.isConfirmed && !renewal.isRenewLease) return "none";
  if (renewal.isConfirmed) return "confirmed";
  if (renewal.isRenewLease) return "requested";
  if (!canRequestLeaseRenewal(lease)) return "none";
  if (isRenewalDismissed(renewal.id)) return "none";
  // Hidden during the final window before lease end (confirmationDeadline = endDate − N days).
  if (isInFinalFiveDaysBeforeEnd(renewal.confirmationDeadline, lease.endDate)) return "none";
  return "prompt";
}

/** True when the lease is in its last 5 days or already past end — prompt is hidden then. */
export function isInFinalFiveDaysBeforeEnd(
  confirmationDeadline: string,
  leaseEnd?: string,
): boolean {
  const now = new Date();
  if (leaseEnd && now > new Date(leaseEnd)) return true;
  const deadline = new Date(confirmationDeadline);
  if (now < deadline) return false;
  if (leaseEnd) {
    return now <= new Date(leaseEnd);
  }
  return true;
}

export type TenantRenewalDisplayStatus =
  | "action_needed"
  | "requested"
  | "confirmed"
  | "completed"
  | "declined"
  | "window_closed"
  | "not_eligible";

export function getTenantRenewalDisplayStatus(
  lease: Lease,
): TenantRenewalDisplayStatus | null {
  const renewal = lease.leaseRenewal;
  if (!renewal) return null;
  if (renewal.markAsCompleted) return "completed";
  if (renewal.isConfirmed && renewal.isRenewLease) return "confirmed";
  if (renewal.isRenewLease) return "requested";
  if (renewal.isConfirmed && !renewal.isRenewLease) return "declined";
  if (lease.status !== "paid") return "not_eligible";
  if (isRenewalDismissed(renewal.id)) return "declined";
  if (isInFinalFiveDaysBeforeEnd(renewal.confirmationDeadline, lease.endDate)) {
    return "window_closed";
  }
  return "action_needed";
}

export function hasLeaseRenewal(lease: Lease): boolean {
  return lease.leaseRenewal != null;
}
