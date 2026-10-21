"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import {
  buildCreateLeaseHref,
  buildViewLeaseHref,
} from "@/features/admin/units/lib/lease-links";
import { Link } from "@/i18n/routing";
import type { Unit } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const UNITS_BASE = "/admin/units";

interface UnitRowActionsProps {
  unit: Unit;
  onDelete: () => void;
  disabled?: boolean;
  suggestedLeaseStartDate?: string;
}

export function UnitRowActions({
  unit,
  onDelete,
  disabled,
  suggestedLeaseStartDate,
}: UnitRowActionsProps) {
  const tc = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.units");
  const lease = unit.activeLease ?? null;

  const actionClass = cn(
    "inline-flex size-8 items-center justify-center rounded-lg text-fg-2 transition-colors disabled:opacity-50",
    disabled && "pointer-events-none opacity-50",
  );

  return (
    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
      {lease ? (
        <Link
          href={buildViewLeaseHref(lease.id)}
          className={cn(actionClass, "hover:bg-success-soft/80 hover:text-success")}
          aria-label={tp("viewLease")}
          title={tp("viewLease")}
        >
          <Icon name={adminPageIcons.leases} size={18} />
        </Link>
      ) : (
        <Link
          href={buildCreateLeaseHref(unit.id, suggestedLeaseStartDate)}
          className={cn(actionClass, "hover:bg-warning-soft/80 hover:text-brand")}
          aria-label={tp("createLease")}
          title={tp("createLease")}
        >
          <Icon name="post_add" size={18} />
        </Link>
      )}
      <Link
        href={`${UNITS_BASE}/${unit.id}/edit`}
        className={cn(actionClass, "hover:bg-hover hover:text-brand")}
        aria-label={tc("editTitle")}
        title={tc("editTitle")}
      >
        <Icon name="edit" size={18} />
      </Link>
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className={cn(
          actionClass,
          "hover:bg-danger-soft/60 hover:text-danger",
        )}
        aria-label={tc("deleteConfirm")}
        title={tc("deleteConfirm")}
      >
        <Icon name="delete" size={18} />
      </button>
    </div>
  );
}
