"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  getLeaseEndDateValue,
  resolveUnitPropertyName,
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
} from "@/features/admin/lib/entity-display";
import { formatDate } from "@/features/admin/lib/format";
import {
  Avatar,
  DueChip,
  TermProgress,
} from "@/features/admin/operations/ops-kit";
import { parseUnitFloor } from "@/features/admin/units/lib/group-units-for-map";
import {
  buildCreateLeaseHref,
  buildViewLeaseHref,
} from "@/features/admin/units/lib/lease-links";
import { Link } from "@/i18n/routing";
import { contactSummary } from "@/lib/phone";
import { isUnitOccupied, type Unit, type UnitStatus } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const UNITS_BASE = "/admin/units";

interface UnitDetailSheetProps {
  unit: Unit | null;
  lookups: AdminLookups;
  onClose: () => void;
  onDelete: (unit: Unit) => void;
  deleteDisabled?: boolean;
  suggestedLeaseStartDate?: string;
}

function FactTile({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Icon name={icon} size={16} />
      </span>
      <p className="mt-2.5 text-xs text-fg-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-fg tabular-nums">
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
      {children}
    </p>
  );
}

/**
 * Room details slide-over (units map and 3D building views): black header
 * with the room's identity and status, quick facts, the current lease and
 * the next action.
 */
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
  const status = (unit?.status.toLowerCase() ?? "vacant") as UnitStatus;
  const occupied = isUnitOccupied(status);
  const floor = unit ? parseUnitFloor(unit.name) : null;
  const size = unit
    ? (unit.unitType?.size ?? lookups.unitTypeById.get(unit.unitTypeId)?.size)
    : null;
  const tenant = unit ? resolveUnitTenantLabel(unit) : "—";

  return (
    <Sheet open={unit !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[min(calc(100%-1.5rem),26rem)] gap-0 rounded-2xl bg-canvas! p-0 sm:max-w-[26rem]"
      >
        {unit && (
          <>
            {/* ——— Identity: black header ——— */}
            <header className="relative shrink-0 overflow-hidden bg-ink px-5 pb-5 pt-4 text-white">
              <span
                className="pointer-events-none absolute -right-14 -top-20 size-52 rounded-full bg-brand/45 blur-3xl"
                aria-hidden
              />
              <div className="relative flex items-center justify-between gap-3">
                <SheetDescription className="flex min-w-0 items-center gap-1.5 text-sm text-white/60">
                  <Icon
                    name={adminPageIcons.properties}
                    size={16}
                    className="shrink-0"
                  />
                  <span className="truncate">
                    {resolveUnitPropertyName(unit, lookups)}
                  </span>
                </SheetDescription>
                <SheetClose
                  aria-label={t("closeDetails")}
                  className="-mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                >
                  <Icon name="close" size={20} />
                </SheetClose>
              </div>

              <div className="relative mt-4 flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon name={adminPageIcons.units} size={26} />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-2xl font-semibold tracking-tight text-white">
                    {unit.name}
                  </SheetTitle>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-white/70">
                    <Icon
                      name={adminPageIcons.unitTypes}
                      size={15}
                      className="shrink-0"
                    />
                    {resolveUnitTypeNameForUnit(unit, lookups)}
                  </p>
                </div>
              </div>

              <span className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-white/15">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    occupied ? "bg-brand-bright" : "bg-success-bright",
                  )}
                  aria-hidden
                />
                {t(`status.${status}`)}
              </span>
            </header>

            {/* ——— Body ——— */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-2.5">
                <FactTile
                  icon="layers"
                  label={tc("floor")}
                  value={floor === null ? "—" : String(floor)}
                />
                <FactTile
                  icon="square_foot"
                  label={tc("size")}
                  value={size ? String(size) : "—"}
                />
                <FactTile
                  icon={adminPageIcons.users}
                  label={tc("maxOccupancy")}
                  value={
                    unit.maxOccupancy != null ? String(unit.maxOccupancy) : "—"
                  }
                />
              </div>

              <section>
                <SectionLabel>{t("activeLease")}</SectionLabel>
                {lease ? (
                  <div className="rounded-xl border border-line bg-panel">
                    <div className="flex items-center gap-3 p-4">
                      <Avatar
                        name={tenant}
                        seed={lease.userId}
                        className="size-10 text-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-fg">
                          {tenant}
                        </p>
                        {contactSummary(lease.user) ? (
                          <p className="truncate text-xs text-fg-muted">
                            {contactSummary(lease.user)}
                          </p>
                        ) : null}
                      </div>
                      <LeaseStatusBadge status={lease.status} />
                    </div>

                    <div className="border-t border-line p-4">
                      <TermProgress
                        start={lease.startDate}
                        end={endDate ?? lease.startDate}
                      />
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-xs text-fg-muted">
                            {t("leaseStart")}
                          </dt>
                          <dd className="mt-0.5 font-medium text-fg">
                            {formatDate(lease.startDate, locale)}
                          </dd>
                        </div>
                        <div className="text-right">
                          <dt className="text-xs text-fg-muted">
                            {t("leaseEnd")}
                          </dt>
                          <dd className="mt-0.5 font-medium text-fg">
                            {endDate ? formatDate(endDate, locale) : "—"}
                          </dd>
                        </div>
                      </dl>
                      {endDate ? (
                        <DueChip
                          date={endDate}
                          warnWithin={30}
                          className="mt-3"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-panel px-5 py-6 text-center">
                    <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
                      <Icon name={adminPageIcons.leases} size={22} />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-fg">
                      {t("noActiveLease")}
                    </p>
                    <p className="mt-1 max-w-[16rem] text-xs text-fg-muted">
                      {t("noLeaseHint")}
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* ——— Actions ——— */}
            <footer className="shrink-0 space-y-2 border-t border-line bg-panel p-4">
              <Link
                href={
                  lease
                    ? buildViewLeaseHref(lease.id)
                    : buildCreateLeaseHref(unit.id, suggestedLeaseStartDate)
                }
                className="admin-btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors"
              >
                <Icon
                  name={lease ? adminPageIcons.leases : "post_add"}
                  size={18}
                />
                {lease ? t("viewLease") : t("createLease")}
              </Link>
              <div className="flex gap-2">
                <Link
                  href={`${UNITS_BASE}/${unit.id}/edit`}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong bg-panel text-sm font-medium text-fg transition-colors hover:border-fg hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <Icon name="edit" size={17} />
                  {tc("editTitle")}
                </Link>
                <button
                  type="button"
                  disabled={deleteDisabled}
                  onClick={() => onDelete(unit)}
                  aria-label={tc("deleteConfirm")}
                  title={tc("deleteConfirm")}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg-muted transition-colors hover:border-danger/40 hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:pointer-events-none disabled:opacity-40"
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
