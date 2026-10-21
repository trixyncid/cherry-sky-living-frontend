/**
 * Unit Type Search Grid
 * Estoria-style room type cards with Details + WhatsApp inquiry
 */

"use client";

import { useTranslations } from "next-intl";
import { RoomTile } from "@/components/kost/RoomTile";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { MONTHLY_DURATION_DAYS } from "@/lib/billing";
import type { SearchUnitTypeResult } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

interface UnitTypeSearchGridProps {
  unitTypes: SearchUnitTypeResult[];
  isLoading?: boolean;
  view?: "grid" | "table";
  onReset?: () => void;
}

function monthlyDisplay(unitType: SearchUnitTypeResult) {
  const startingPricing =
    unitType.pricings.find((p) => p.durationDays === MONTHLY_DURATION_DAYS) ??
    unitType.pricings[0];
  const displayPrice =
    startingPricing?.price ?? (unitType.minPrice > 0 ? unitType.minPrice : 0);
  return { startingPricing, displayPrice };
}

/** Compact comparison view (§5.5): one row per room type. */
function UnitTypeTable({ unitTypes }: { unitTypes: SearchUnitTypeResult[] }) {
  const t = useTranslations();
  return (
    <div className="overflow-x-auto rounded-[1.25rem] bg-white">
      <table className="w-full min-w-[40rem] text-left text-[15px]">
        <thead className="border-b border-hover text-[13px] font-semibold text-fg-muted">
          <tr>
            <th scope="col" className="px-5 py-4">
              {t("search.colRoom")}
            </th>
            <th scope="col" className="px-5 py-4">
              {t("search.colResidence")}
            </th>
            <th scope="col" className="px-5 py-4">
              {t("search.colSize")}
            </th>
            <th scope="col" className="px-5 py-4 text-right">
              {t("search.colPrice")}
            </th>
            <th scope="col" className="px-5 py-4">
              {t("search.colStatus")}
            </th>
            <th scope="col" className="px-5 py-4">
              <span className="sr-only">{t("cta.viewDetails")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hover">
          {unitTypes.map((unitType) => {
            const detailUrl = `/kosts/${unitType.propertyId}/${unitType.id}`;
            const { displayPrice } = monthlyDisplay(unitType);
            const isOpen = unitType.availableCount > 0;
            return (
              <tr
                key={`${unitType.propertyId}-${unitType.id}`}
                className="hover:bg-canvas"
              >
                <td className="px-5 py-4 font-semibold text-fg">
                  <Link href={detailUrl} className="hover:text-brand">
                    {unitType.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-fg-2">{unitType.propertyName}</td>
                <td className="px-5 py-4 text-fg-2">
                  {unitType.size ? `${unitType.size} m²` : "—"}
                </td>
                <td className="px-5 py-4 text-right font-semibold tabular-nums text-fg">
                  {displayPrice > 0
                    ? formatCurrency(displayPrice)
                    : t("search.noPricing")}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-fg">
                    <span
                      className={`size-1.5 rounded-full ${isOpen ? "bg-status-vacant" : "bg-status-occupied"}`}
                    />
                    {isOpen
                      ? t("search.unitsAvailable", {
                          count: unitType.availableCount,
                        })
                      : t("status.full")}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {isOpen ? (
                    <Link
                      href={detailUrl}
                      className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
                    >
                      {t("cta.viewDetails")}
                    </Link>
                  ) : (
                    <LeadDialog
                      type="waitlist"
                      propertyId={unitType.propertyId}
                      propertyName={unitType.propertyName}
                      unitTypeId={unitType.id}
                      roomName={unitType.name}
                      trigger={
                        <button
                          type="button"
                          className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-line-strong px-4 text-sm font-semibold text-fg hover:border-fg"
                        >
                          {t("leads.submit.waitlist")}
                        </button>
                      }
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function UnitTypeSearchGrid({
  unitTypes,
  isLoading,
  view = "grid",
  onReset,
}: UnitTypeSearchGridProps) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-[26rem] animate-pulse rounded-[1.25rem] bg-white"
          />
        ))}
      </div>
    );
  }

  if (unitTypes.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5 rounded-[1.25rem] bg-white p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-canvas text-brand">
            <Icon name="search_off" size={24} />
          </span>
          <div>
            <h3 className="text-xl font-medium tracking-tight text-fg">
              {t("search.emptyTitle")}
            </h3>
            <p className="mt-1 max-w-xl text-base text-fg-muted">
              {t("search.emptyDescription")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center rounded-full border border-line-strong px-5 text-[15px] font-semibold text-fg hover:border-fg"
            >
              {t("search.clearAll")}
            </button>
          ) : null}
          <LeadDialog
            type="waitlist"
            trigger={
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-semibold text-white hover:bg-brand-hover"
              >
                <Icon name="notifications" size={16} />
                {t("search.emptyWaitlist")}
              </button>
            }
          />
        </div>
      </div>
    );
  }

  if (view === "table") {
    return <UnitTypeTable unitTypes={unitTypes} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {unitTypes.map((unitType) => {
        const { displayPrice } = monthlyDisplay(unitType);
        return (
          <RoomTile
            key={`${unitType.propertyId}-${unitType.id}`}
            roomTypeId={unitType.id}
            propertyId={unitType.propertyId}
            name={unitType.name}
            propertyName={unitType.propertyName}
            city={unitType.city}
            image={unitType.thumbnail}
            availableCount={unitType.availableCount}
            totalCount={unitType.totalCount}
            monthlyPrice={displayPrice}
            whatsappNumber={unitType.whatsappNumber}
            deposit={unitType.deposit}
            tags={unitType.size ? [`${unitType.size} m²`] : []}
          />
        );
      })}
    </div>
  );
}
