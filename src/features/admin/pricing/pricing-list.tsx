"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminSelect } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  AdminToolbar,
  usePropertyToolbarFilter,
} from "@/features/admin/components/admin-toolbar";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  useUnitPricingMutations,
  useUnitPricings,
  useUnitTypes,
} from "@/features/admin/hooks/use-admin-queries";
import {
  EmptyPanel,
  firstPhoto,
  IconAction,
  Photo,
  panel,
  rupiah,
  SkeletonCards,
} from "@/features/admin/inventory/inventory-kit";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatIdrTable } from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { Link } from "@/i18n/routing";
import { DAILY_DURATION_DAYS, MONTHLY_DURATION_DAYS } from "@/lib/billing";
import type { UnitPricing, UnitType } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const BASE = "/admin/pricing";

type RateRow = {
  unitTypeId: string;
  propertyId: string;
  name: string;
  size: number | null;
  photo?: string;
  monthly: UnitPricing | null;
  daily: UnitPricing | null;
  /** Edit URL id: prefer monthly, fall back to daily. */
  editId: string | null;
};

/**
 * Pricing — a rate card per property. Room types line up as a price
 * ladder (cheapest → priciest) with monthly and daily rates, the saving a
 * monthly stay gives over paying daily, and room types still missing a
 * price surface as a call to action instead of hiding.
 */
export function PricingList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.pricing");
  const ti = useTranslations("admin.pages.inventory");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [search, setSearch] = useState("");
  const [priceState, setPriceState] = useState<"" | "missing" | "priced">("");
  const tt = useTranslations("admin.toolbar");
  const {
    data = [],
    isLoading,
    error,
  } = useUnitPricings({
    propertyId: propertyFilter || undefined,
  });
  const { data: unitTypes = [], isLoading: typesLoading } = useUnitTypes(
    propertyFilter || undefined,
  );
  const mutations = useUnitPricingMutations();
  const deleteDialog = useDeleteDialog<RateRow>();
  const lookups = useAdminLookups();

  const rows = useMemo<RateRow[]>(() => {
    const byType = new Map<string, RateRow>();
    const ensure = (
      ut: Pick<UnitType, "id" | "name" | "propertyId" | "size"> & {
        unitTypeAttachments?: UnitType["unitTypeAttachments"];
      },
    ) => {
      let row = byType.get(ut.id);
      if (!row) {
        row = {
          unitTypeId: ut.id,
          propertyId: ut.propertyId,
          name: ut.name,
          size: ut.size,
          photo: firstPhoto(ut.unitTypeAttachments),
          monthly: null,
          daily: null,
          editId: null,
        };
        byType.set(ut.id, row);
      }
      return row;
    };
    for (const ut of unitTypes) ensure(ut);
    for (const p of data) {
      const ut = p.unitType ??
        lookups.unitTypeById.get(p.unitTypeId) ?? {
          id: p.unitTypeId,
          name: "—",
          propertyId: p.propertyId,
          size: null,
        };
      const row = ensure({ ...ut, propertyId: p.propertyId });
      if (p.durationDays === MONTHLY_DURATION_DAYS) {
        row.monthly = p;
        row.editId = p.id;
      } else if (p.durationDays === DAILY_DURATION_DAYS) {
        row.daily = p;
        row.editId ??= p.id;
      }
    }
    const q = search.trim().toLowerCase();
    return [...byType.values()].filter(
      (r) =>
        !q ||
        [
          r.name,
          lookups.propertyById.get(r.propertyId)?.name ?? "",
          String(r.monthly?.price ?? ""),
          String(r.daily?.price ?? ""),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
    );
  }, [data, unitTypes, lookups, search]);

  const visibleRows = useMemo(
    () =>
      rows.filter((r) =>
        priceState === "missing"
          ? !r.monthly
          : priceState === "priced"
            ? Boolean(r.monthly)
            : true,
      ),
    [rows, priceState],
  );

  const byProperty = useMemo(() => {
    const map = new Map<string, RateRow[]>();
    for (const r of visibleRows) {
      const list = map.get(r.propertyId);
      if (list) list.push(r);
      else map.set(r.propertyId, [r]);
    }
    return [...map.entries()]
      .map(([id, list]) => ({
        id,
        name: lookups.propertyById.get(id)?.name ?? "—",
        rows: list.sort(
          (a, b) =>
            (a.monthly?.price ?? Number.MAX_SAFE_INTEGER) -
            (b.monthly?.price ?? Number.MAX_SAFE_INTEGER),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [visibleRows, lookups]);

  const insight = useMemo(() => {
    const monthlies = rows
      .map((r) => r.monthly?.price)
      .filter((v): v is number => typeof v === "number");
    return {
      avg: monthlies.length
        ? Math.round(monthlies.reduce((s, v) => s + v, 0) / monthlies.length)
        : null,
      min: monthlies.length ? Math.min(...monthlies) : null,
      max: monthlies.length ? Math.max(...monthlies) : null,
      missing: rows.filter((r) => !r.monthly),
    };
  }, [rows]);

  async function confirmDelete() {
    if (!deleteDialog.item) return;
    try {
      const { monthly, daily } = deleteDialog.item;
      if (monthly) await mutations.remove.mutateAsync(monthly.id);
      if (daily) await mutations.remove.mutateAsync(daily.id);
      showApiSuccess(t("deleted"));
      deleteDialog.close();
    } catch (err) {
      showApiError(err, t("deleteFailed"));
    }
  }

  const pending = mutations.remove.isPending;
  const loading = isLoading || typesLoading;
  const propertyToolbar = usePropertyToolbarFilter(
    propertyFilter,
    setPropertyFilter,
  );

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={{ label: t("add"), href: `${BASE}/new`, icon: "add" }}
      />

      {/* Insight strip */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Insight
          icon="payments"
          label={ti("avgMonthly")}
          value={insight.avg !== null ? rupiah(insight.avg) : "—"}
        />
        <Insight
          icon="height"
          label={ti("priceRange")}
          value={
            insight.min !== null && insight.max !== null
              ? `${rupiah(insight.min)} – ${rupiah(insight.max)}`
              : "—"
          }
        />
        <Insight
          icon={insight.missing.length ? "error" : "task_alt"}
          label={ti("missingPrices")}
          value={String(insight.missing.length)}
          hint={insight.missing.length ? ti("missingHint") : ti("allPriced")}
          tone={insight.missing.length ? "warn" : "ok"}
        />
      </div>

      <AdminToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t("searchPlaceholder"),
        }}
        filters={[
          propertyToolbar,
          {
            key: "prices",
            label: tt("prices"),
            active: priceState !== "",
            chip: priceState === "missing" ? tt("missingPrice") : tt("priced"),
            onClear: () => setPriceState(""),
            width: "w-48",
            control: (
              <AdminSelect
                value={priceState}
                onChange={(e) =>
                  setPriceState(e.target.value as typeof priceState)
                }
              >
                <option value="">{tt("all")}</option>
                <option value="missing">{tt("missingPrice")}</option>
                <option value="priced">{tt("priced")}</option>
              </AdminSelect>
            ),
          },
        ]}
        resultCount={loading ? undefined : visibleRows.length}
      />

      {error ? (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      ) : null}

      {loading ? (
        <SkeletonCards count={2} />
      ) : byProperty.length === 0 ? (
        <EmptyPanel icon="sell" title={t("empty")} />
      ) : (
        <div className="space-y-5">
          {byProperty.map((group) => {
            const top = Math.max(
              1,
              ...group.rows.map((r) => r.monthly?.price ?? 0),
            );
            return (
              <section key={group.id} className={cn(panel, "p-4 sm:p-6")}>
                <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#71130d]">
                      {ti("rateCard")}
                    </p>
                    <h3 className="text-xl font-medium tracking-tight text-[#141414]">
                      {group.name}
                    </h3>
                  </div>
                  <p className="text-sm text-[#6b6b6b]">
                    {ti("typesCount", { count: group.rows.length })}
                  </p>
                </header>

                <ol className="flex flex-col gap-2">
                  {group.rows.map((row, i) => (
                    <RateLine
                      key={row.unitTypeId}
                      row={row}
                      rank={i + 1}
                      top={top}
                      onDelete={() => deleteDialog.openDelete(row)}
                      deleteDisabled={pending}
                    />
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}

      <AdminDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && deleteDialog.close()}
        itemName={deleteDialog.item?.name ?? ""}
        onConfirm={() => void confirmDelete()}
        pending={pending}
      />
    </>
  );
}

function RateLine({
  row,
  rank,
  top,
  onDelete,
  deleteDisabled,
}: {
  row: RateRow;
  rank: number;
  top: number;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  const t = useTranslations("admin.crud");
  const ti = useTranslations("admin.pages.inventory");
  const monthly = row.monthly?.price ?? null;
  const daily = row.daily?.price ?? null;
  const saving =
    monthly !== null && daily !== null && daily * 30 > monthly
      ? Math.round((1 - monthly / (daily * 30)) * 100)
      : null;

  if (monthly === null && daily === null) {
    return (
      <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-[#e3d6d3] p-3">
        <Photo
          src={row.photo}
          alt=""
          sizes="56px"
          className="size-12 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[#141414]">{row.name}</p>
          <p className="text-sm text-[#a1271b]">{ti("missingHint")}</p>
        </div>
        <Link
          href={`${BASE}/new?propertyId=${encodeURIComponent(row.propertyId)}&unitTypeId=${encodeURIComponent(row.unitTypeId)}`}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#71130d] px-4 text-sm font-medium text-white hover:bg-[#8a1a12]"
        >
          <Icon name="sell" size={16} />
          {ti("setPrice")}
        </Link>
      </li>
    );
  }

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 rounded-2xl bg-[#faf7f6] p-3 sm:grid-cols-[auto_minmax(0,1.1fr)_minmax(0,1.6fr)_auto] sm:gap-x-5">
      <div className="relative">
        <Photo
          src={row.photo}
          alt=""
          sizes="56px"
          className="size-12 rounded-xl"
        />
        <span className="absolute -left-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-[#1c0b0a] text-[11px] font-semibold text-white ring-2 ring-white">
          {rank}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-[#141414]">{row.name}</p>
        <p className="text-sm text-[#6b6b6b]">
          {row.size != null ? `${row.size} m²` : "—"}
          {monthly !== null && row.size
            ? ` · ${ti("perSqm", { price: rupiah(Math.round(monthly / row.size)) })}`
            : ""}
        </p>
      </div>

      {/* Price ladder */}
      <div className="col-span-3 min-w-0 sm:col-span-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-lg font-medium text-[#141414] tabular-nums">
            {monthly !== null ? `Rp ${formatIdrTable(monthly)}` : "—"}
            <span className="text-sm font-normal text-[#6b6b6b]">
              {ti("perMonth")}
            </span>
          </p>
          <p className="shrink-0 text-sm text-[#3d3a36] tabular-nums">
            {daily !== null
              ? `Rp ${formatIdrTable(daily)}${ti("perDay")}`
              : ti("noDaily")}
          </p>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-white">
            <span
              className="block h-full rounded-full bg-[linear-gradient(90deg,#e8bfb9,#71130d)] transition-[width] duration-700"
              style={{ width: `${((monthly ?? 0) / top) * 100}%` }}
            />
          </span>
          {saving !== null && saving > 0 ? (
            <span className="shrink-0 rounded-full bg-[#dff3d6] px-2 py-0.5 text-xs font-medium text-[#1f5a2a]">
              {ti("monthlySaves", { pct: saving })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="col-start-3 row-start-1 flex gap-1.5 sm:col-start-auto sm:row-start-auto">
        {row.editId ? (
          <IconAction
            icon="edit"
            label={t("editTitle")}
            href={`${BASE}/${row.editId}/edit`}
          />
        ) : null}
        <IconAction
          icon="delete"
          tone="danger"
          label={t("deleteConfirm")}
          onClick={onDelete}
          disabled={deleteDisabled}
        />
      </div>
    </li>
  );
}

function Insight({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "warn" | "ok";
}) {
  return (
    <div className={cn(panel, "flex items-start gap-3 p-4")}>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          tone === "warn"
            ? "bg-[#fde2df] text-[#a1271b]"
            : tone === "ok"
              ? "bg-[#dff3d6] text-[#2f6d22]"
              : "bg-[#f6f0ef] text-[#71130d]",
        )}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-[#6b6b6b]">{label}</p>
        <p className="truncate text-xl font-medium tracking-tight text-[#141414] tabular-nums">
          {value}
        </p>
        {hint ? <p className="text-xs text-[#6b6b6b]">{hint}</p> : null}
      </div>
    </div>
  );
}
