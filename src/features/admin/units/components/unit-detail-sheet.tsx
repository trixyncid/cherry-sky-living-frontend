"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UnitStatusBadge, LeaseStatusBadge } from "@/features/admin/components/status-badge";
import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  getLeaseEndDateValue,
  resolveUnitPropertyName,
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
} from "@/features/admin/lib/entity-display";
import { formatDate } from "@/features/admin/lib/format";
import { Link } from "@/i18n/routing";
import {
  buildCreateLeaseHref,
  buildViewLeaseHref,
} from "@/features/admin/units/lib/lease-links";
import type { Unit } from "@/lib/types/admin";

const UNITS_BASE = "/admin/units";

interface UnitDetailSheetProps {
  unit: Unit | null;
  lookups: AdminLookups;
  onClose: () => void;
  onDelete: (unit: Unit) => void;
  deleteDisabled?: boolean;
  suggestedLeaseStartDate?: string;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/40 py-3 last:border-0">
      <span className="shrink-0 text-sm text-[#83746b]">{label}</span>
      <div className="text-right text-sm font-medium text-[#1a1c1a]">
        {children}
      </div>
    </div>
  );
}

export function UnitDetailSheet({
  unit,
  lookups,
  onClose,
  onDelete,
  deleteDisabled,
  suggestedLeaseStartDate,
}: UnitDetailSheetProps) {
  const t = useTranslations("admin.pages.units");
  const tc = useTranslations("admin.crud");
  const locale = useLocale();
  const lease = unit?.activeLease ?? null;
  const endDate = lease ? getLeaseEndDateValue(lease) : null;

  return (
    <Sheet open={unit !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="top-[max(5.5rem,calc(env(safe-area-inset-top)+4.75rem))] w-[min(calc(100%-1.5rem),28rem)] gap-0 sm:max-w-md"
      >
        {unit && (
          <>
            <SheetHeader className="shrink-0 border-b border-white/50 p-5">
              <div className="flex items-center gap-3 pr-8">
                <div className="rounded-xl border border-[#e3e2e0] bg-white p-2.5 shadow-sm">
                  <Icon name="door_front" size={24} className="text-[#71130d]" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-xl text-[#1a1c1a]">
                    {unit.name}
                  </SheetTitle>
                  <SheetDescription className="truncate">
                    {resolveUnitPropertyName(unit, lookups)}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-1">
              <DetailRow label={tc("status")}>
                <UnitStatusBadge status={unit.status} />
              </DetailRow>
              <DetailRow label={tc("unitType")}>
                {resolveUnitTypeNameForUnit(unit, lookups)}
              </DetailRow>
              <DetailRow label={tc("maxOccupancy")}>
                {unit.maxOccupancy != null ? unit.maxOccupancy : "—"}
              </DetailRow>
              <DetailRow label={tc("tenant")}>
                {resolveUnitTenantLabel(unit)}
              </DetailRow>

              {lease ? (
                <>
                  <p className="pt-4 text-xs font-semibold uppercase tracking-wide text-[#83746b]">
                    {t("activeLease")}
                  </p>
                  <DetailRow label={tc("status")}>
                    <LeaseStatusBadge status={lease.status} />
                  </DetailRow>
                  <DetailRow label={t("leaseStart")}>
                    {formatDate(lease.startDate, locale)}
                  </DetailRow>
                  {endDate && (
                    <DetailRow label={t("leaseEnd")}>
                      {formatDate(endDate, locale)}
                    </DetailRow>
                  )}
                </>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-[#e3e2e0] bg-white/60 px-4 py-3 text-sm text-[#83746b]">
                  {t("noActiveLease")}
                </p>
              )}
            </div>

            <SheetFooter className="mt-auto shrink-0 flex-col gap-2 border-t border-white/50 bg-white/25 p-5 sm:flex-col">
              {lease ? (
                <Button className="w-full bg-[#71130d] hover:bg-[#8a1a12]" asChild>
                  <Link href={buildViewLeaseHref(lease.id)}>
                    <Icon name="description" size={18} />
                    {t("viewLease")}
                  </Link>
                </Button>
              ) : (
                <Button className="w-full bg-[#71130d] hover:bg-[#8a1a12]" asChild>
                  <Link
                    href={buildCreateLeaseHref(
                      unit.id,
                      suggestedLeaseStartDate,
                    )}
                  >
                    <Icon name="post_add" size={18} />
                    {t("createLease")}
                  </Link>
                </Button>
              )}
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`${UNITS_BASE}/${unit.id}/edit`}>
                    {tc("editTitle")}
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteDisabled}
                  onClick={() => onDelete(unit)}
                >
                  {tc("deleteConfirm")}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
