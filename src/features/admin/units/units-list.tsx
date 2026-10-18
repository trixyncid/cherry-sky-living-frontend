"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminDateRangePicker } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  AdminToolbar,
  usePropertyToolbarFilter,
} from "@/features/admin/components/admin-toolbar";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  useUnitMutations,
  useUnits,
  useVacantUnits,
} from "@/features/admin/hooks/use-admin-queries";
import {
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
} from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate } from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import type { AvailabilityRange } from "@/features/admin/units/components/units-availability-filter";
import { UnitsBuildingView } from "@/features/admin/units/components/units-building-view";
import { UnitsTableView } from "@/features/admin/units/components/units-table-view";
import {
  type UnitsViewMode,
  UnitsViewToggle,
} from "@/features/admin/units/components/units-view-toggle";
import type { Unit } from "@/lib/types/admin";

const BASE = "/admin/units";

export function UnitsList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.units");
  const tAvail = useTranslations("admin.pages.units.availability");
  const locale = useLocale();

  // Links like ?propertyId=… (from a property card) open that building.
  const [propertyFilter, setPropertyFilter] = useState("");
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(
      "propertyId",
    );
    if (fromUrl) setPropertyFilter(fromUrl);
  }, []);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<UnitsViewMode>("map");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [activeRange, setActiveRange] = useState<AvailabilityRange | null>(
    null,
  );
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
  const {
    data = [],
    isLoading,
    error,
    isFetching,
  } = isAvailabilityMode ? vacantUnitsQuery : allUnitsQuery;

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
        resolveUnitTypeNameForUnit(unit, lookups).toLowerCase().includes(q) ||
        (unit.property?.name ?? "").toLowerCase().includes(q) ||
        tenant.toLowerCase().includes(q)
      );
    });
  }, [data, search, lookups]);

  /** Applies as soon as both dates are picked — no separate "Search" step. */
  function handleRangeChange({ from, to }: { from: string; to: string }) {
    setDraftStartDate(from);
    setDraftEndDate(to);
    if (!from && !to) {
      setActiveRange(null);
      setDateError(null);
      return;
    }
    if (!from || !to) return;
    if (from >= to) {
      setDateError(tAvail("invalidDateRange"));
      return;
    }
    setDateError(null);
    setActiveRange({ startDate: from, endDate: to });
  }

  function handleClearAvailability() {
    setDraftStartDate("");
    setDraftEndDate("");
    setActiveRange(null);
    setDateError(null);
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

  const buildingUnits = allUnitsQuery.data ?? [];
  const matchingIds = useMemo(
    () =>
      isAvailabilityMode || search.trim()
        ? new Set(filtered.map((u) => u.id))
        : null,
    [isAvailabilityMode, search, filtered],
  );

  const pending = mutations.remove.isPending;
  const tt = useTranslations("admin.toolbar");
  const propertyToolbar = usePropertyToolbarFilter(
    propertyFilter,
    setPropertyFilter,
  );
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

      <AdminToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t("searchPlaceholder"),
        }}
        filters={[
          propertyToolbar,
          {
            key: "availability",
            label: tt("vacantBetween"),
            active: Boolean(activeRange),
            chip: activeRange
              ? `${formatDate(activeRange.startDate, locale)} – ${formatDate(activeRange.endDate, locale)}`
              : undefined,
            onClear: handleClearAvailability,
            width: "w-64",
            control: (
              <AdminDateRangePicker
                from={draftStartDate}
                to={draftEndDate}
                onChange={handleRangeChange}
                placeholder={tAvail("dateRangePlaceholder")}
              />
            ),
          },
        ]}
        trailing={<UnitsViewToggle value={viewMode} onChange={setViewMode} />}
        resultCount={isLoading || isFetching ? undefined : filtered.length}
      />

      {dateError ? (
        <p className="-mt-2 mb-4 text-sm text-[#a1271b]">{dateError}</p>
      ) : null}

      {error && (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      )}

      {viewMode === "map" ? (
        allUnitsQuery.isLoading || isLoading ? (
          <p className="glass-panel rounded-2xl p-10 text-center text-sm text-[#83746b]">
            {t("loading")}
          </p>
        ) : buildingUnits.length === 0 ? (
          <p className="glass-panel rounded-2xl border-dashed p-10 text-center text-sm text-[#83746b]">
            {emptyMessage}
          </p>
        ) : (
          <UnitsBuildingView
            units={buildingUnits}
            matchingIds={matchingIds}
            availabilityMode={isAvailabilityMode}
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
