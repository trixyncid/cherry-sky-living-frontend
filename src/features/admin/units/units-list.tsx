"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminSearchInput } from "@/features/admin/components/admin-field";
import { AdminFilterRow } from "@/features/admin/components/admin-filter-row";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import {
  UnitsAvailabilityFilter,
  type AvailabilityRange,
} from "@/features/admin/units/components/units-availability-filter";
import { UnitsMapView } from "@/features/admin/units/components/units-map-view";
import { UnitsTableView } from "@/features/admin/units/components/units-table-view";
import {
  UnitsViewToggle,
  type UnitsViewMode,
} from "@/features/admin/units/components/units-view-toggle";
import {
  useUnitMutations,
  useUnits,
  useVacantUnits,
} from "@/features/admin/hooks/use-admin-queries";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
} from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { toDateInputValue } from "@/features/admin/lib/format";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import type { Unit } from "@/lib/types/admin";

const BASE = "/admin/units";

function defaultEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return toDateInputValue(date);
}

export function UnitsList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.units");
  const tAvail = useTranslations("admin.pages.units.availability");
  const locale = useLocale();

  const [propertyFilter, setPropertyFilter] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<UnitsViewMode>("map");
  const [availabilityExpanded, setAvailabilityExpanded] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState(() =>
    toDateInputValue(new Date()),
  );
  const [draftEndDate, setDraftEndDate] = useState(defaultEndDate);
  const [activeRange, setActiveRange] = useState<AvailabilityRange | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const allUnitsQuery = useUnits(propertyFilter || undefined);
  const vacantUnitsQuery = useVacantUnits(
    {
      startDate: activeRange?.startDate ?? "",
      endDate: activeRange?.endDate ?? "",
      propertyId: propertyFilter || undefined,
    },
    !!activeRange,
  );

  const isAvailabilityMode = !!activeRange;
  const { data = [], isLoading, error, isFetching } = isAvailabilityMode
    ? vacantUnitsQuery
    : allUnitsQuery;

  const mutations = useUnitMutations();
  const deleteDialog = useDeleteDialog<Unit>();
  const lookups = useAdminLookups();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((unit) => {
      const tenant = resolveUnitTenantLabel(unit);
      return (
        unit.name.toLowerCase().includes(q) ||
        resolveUnitTypeNameForUnit(unit, lookups)
          .toLowerCase()
          .includes(q) ||
        (unit.property?.name ?? "").toLowerCase().includes(q) ||
        tenant.toLowerCase().includes(q)
      );
    });
  }, [data, search, lookups]);

  function handleApplyAvailability() {
    if (!draftStartDate || !draftEndDate) {
      setDateError(tAvail("datesRequired"));
      return;
    }
    if (draftStartDate >= draftEndDate) {
      setDateError(tAvail("invalidDateRange"));
      return;
    }
    setDateError(null);
    setActiveRange({ startDate: draftStartDate, endDate: draftEndDate });
    setAvailabilityExpanded(false);
  }

  function handleClearAvailability() {
    setActiveRange(null);
    setDateError(null);
    setAvailabilityExpanded(false);
  }

  async function confirmDelete() {
    if (!deleteDialog.item) return;
    try {
      await mutations.remove.mutateAsync(deleteDialog.item.id);
      showApiSuccess(t("deleted"));
      deleteDialog.close();
    } catch (err) {
      showApiError(err, t("deleteFailed"));
    }
  }

  const pending = mutations.remove.isPending;
  const emptyMessage = isAvailabilityMode ? tAvail("empty") : t("empty");

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={{
          label: t("add"),
          href: `${BASE}/new`,
          icon: "add",
        }}
      />

      <UnitsAvailabilityFilter
        expanded={availabilityExpanded}
        onToggleExpanded={() => setAvailabilityExpanded((v) => !v)}
        startDate={draftStartDate}
        endDate={draftEndDate}
        onStartDateChange={setDraftStartDate}
        onEndDateChange={setDraftEndDate}
        activeRange={activeRange}
        dateError={dateError}
        onApply={handleApplyAvailability}
        onClear={handleClearAvailability}
        isFetching={isFetching}
        locale={locale}
      />

      <AdminFilterRow trailing={<UnitsViewToggle value={viewMode} onChange={setViewMode} />}>
        <PropertyFilter value={propertyFilter} onChange={setPropertyFilter} />
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
          className="sm:max-w-md sm:flex-1"
        />
      </AdminFilterRow>

      {isAvailabilityMode && !isLoading && (
        <p className="mb-4 text-sm text-[#51443c]">
          {tAvail("resultsCount", { count: filtered.length })}
        </p>
      )}

      {error && (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      )}

      {viewMode === "map" ? (
        isLoading ? (
          <p className="glass-panel rounded-2xl p-10 text-center text-sm text-[#83746b]">
            {t("loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="glass-panel rounded-2xl border-dashed p-10 text-center text-sm text-[#83746b]">
            {emptyMessage}
          </p>
        ) : (
          <UnitsMapView
            units={filtered}
            lookups={lookups}
            onDelete={(unit) => deleteDialog.openDelete(unit)}
            deleteDisabled={pending}
            suggestedLeaseStartDate={activeRange?.startDate}
          />
        )
      ) : (
        <UnitsTableView
          units={filtered}
          lookups={lookups}
          isLoading={isLoading}
          onDelete={(unit) => deleteDialog.openDelete(unit)}
          deleteDisabled={pending}
          emptyMessage={emptyMessage}
          suggestedLeaseStartDate={activeRange?.startDate}
        />
      )}

      <AdminDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && deleteDialog.close()}
        itemName={deleteDialog.item?.name ?? ""}
        onConfirm={confirmDelete}
        pending={pending}
      />
    </>
  );
}
