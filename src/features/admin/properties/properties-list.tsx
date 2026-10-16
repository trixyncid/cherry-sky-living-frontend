"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminSearchInput } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import {
  useProperties,
  usePropertyMutations,
  useUnits,
} from "@/features/admin/hooks/use-admin-queries";
import {
  EmptyPanel,
  firstPhoto,
  IconAction,
  monthlyOf,
  Photo,
  type PropertyWithInventory,
  panel,
  rupiah,
  SkeletonCards,
  VacancyMeter,
} from "@/features/admin/inventory/inventory-kit";
import { countPropertyAttachments } from "@/features/admin/lib/attachments";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { Link } from "@/i18n/routing";
import { isUnitOccupied, type Property } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const BASE = "/admin/properties";

type PropertyStats = {
  total: number;
  occupied: number;
  vacant: number;
  typeCount: number;
  fromMonthly: number | null;
  rentRoll: number;
  potential: number;
};

/**
 * Properties — a photo-led portfolio. Each building gets a showcase card
 * with live occupancy, rent roll and quick jumps into its rooms and room
 * types; a dark band on top sums up the whole portfolio.
 */
export function PropertiesList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.properties");
  const ti = useTranslations("admin.pages.inventory");
  const { data = [], isLoading, error } = useProperties();
  const { data: units = [] } = useUnits();
  const mutations = usePropertyMutations();
  const deleteDialog = useDeleteDialog<Property>();
  const [search, setSearch] = useState("");

  const properties = data as PropertyWithInventory[];

  const stats = useMemo(() => {
    const map = new Map<string, PropertyStats>();
    for (const p of properties) {
      const monthlyByType = new Map(
        (p.unitTypes ?? []).map((ut) => [ut.id, monthlyOf(ut.pricings)]),
      );
      const own = units.filter((u) => u.propertyId === p.id);
      const occupied = own.filter((u) => isUnitOccupied(u.status));
      const priceOf = (unitTypeId: string) =>
        monthlyByType.get(unitTypeId) ?? 0;
      const monthlies = [...monthlyByType.values()].filter(
        (v): v is number => v !== null,
      );
      map.set(p.id, {
        total: own.length || (p._count?.units ?? 0),
        occupied: occupied.length,
        vacant: own.length - occupied.length,
        typeCount: p.unitTypes?.length ?? p._count?.unitTypes ?? 0,
        fromMonthly: monthlies.length ? Math.min(...monthlies) : null,
        rentRoll: occupied.reduce((s, u) => s + priceOf(u.unitTypeId), 0),
        potential: own.reduce((s, u) => s + priceOf(u.unitTypeId), 0),
      });
    }
    return map;
  }, [properties, units]);

  const totals = useMemo(() => {
    let total = 0;
    let occupied = 0;
    let rentRoll = 0;
    let potential = 0;
    for (const s of stats.values()) {
      total += s.total;
      occupied += s.occupied;
      rentRoll += s.rentRoll;
      potential += s.potential;
    }
    return { total, occupied, rentRoll, potential };
  }, [stats]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...properties].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter((p) =>
      [p.name, p.address, p.city].join(" ").toLowerCase().includes(q),
    );
  }, [properties, search]);

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
  const occupancy =
    totals.total > 0 ? Math.round((totals.occupied / totals.total) * 100) : 0;

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={{ label: t("add"), href: `${BASE}/new`, icon: "add" }}
        className="mb-5"
      />

      {/* Portfolio band */}
      <section className="relative mb-5 overflow-hidden rounded-[1.75rem] bg-[#1c0b0a] p-5 text-white sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#71130d]/50 blur-3xl"
        />
        <div className="relative grid grid-cols-2 gap-4 lg:grid-cols-[auto_1fr_1fr_1fr] lg:items-center lg:gap-8">
          <div className="col-span-2 flex items-center gap-4 lg:col-span-1">
            <OccupancyRing percent={occupancy} />
            <div>
              <p className="text-sm text-white/70">{ti("portfolio")}</p>
              <p className="text-2xl font-medium tracking-tight">
                {ti("occupancyOf", { percent: occupancy })}
              </p>
            </div>
          </div>
          <BandStat
            label={ti("properties")}
            value={String(properties.length)}
            hint={ti("roomsTotal", { count: totals.total })}
          />
          <BandStat
            label={ti("rentRoll")}
            value={rupiah(totals.rentRoll)}
            hint={ti("rentRollHint")}
          />
          <BandStat
            label={ti("potential")}
            value={rupiah(totals.potential)}
            hint={ti("potentialHint", {
              gap: rupiah(Math.max(0, totals.potential - totals.rentRoll)),
            })}
          />
        </div>
      </section>

      <div className="mb-5 flex">
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
          className="w-full sm:max-w-md"
        />
      </div>

      {error ? (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      ) : null}

      {isLoading ? (
        <SkeletonCards count={2} className="lg:grid-cols-2" />
      ) : filtered.length === 0 && search ? (
        <EmptyPanel icon="search_off" title={t("empty")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              stats={stats.get(property.id)}
              onDelete={() => deleteDialog.openDelete(property)}
              deleteDisabled={pending}
            />
          ))}
          <Link
            href={`${BASE}/new`}
            className="group flex min-h-64 flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-[#e3d6d3] p-8 text-center transition-colors hover:border-[#c97f76] hover:bg-white/60"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-white text-[#71130d] shadow-sm transition-transform group-hover:scale-105">
              <Icon name="add_home" size={26} />
            </span>
            <span className="text-lg font-medium text-[#141414]">
              {ti("addProperty")}
            </span>
            <span className="max-w-xs text-[15px] text-[#6b6b6b]">
              {ti("addPropertyHint")}
            </span>
          </Link>
        </div>
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

function PropertyCard({
  property,
  stats,
  onDelete,
  deleteDisabled,
}: {
  property: PropertyWithInventory;
  stats?: PropertyStats;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  const t = useTranslations("admin.crud");
  const ti = useTranslations("admin.pages.inventory");
  const photo = firstPhoto(property.propertyAttachments);
  const photos = countPropertyAttachments(property);
  const s = stats ?? {
    total: 0,
    occupied: 0,
    vacant: 0,
    typeCount: 0,
    fromMonthly: null,
    rentRoll: 0,
    potential: 0,
  };
  const scoped = `?propertyId=${encodeURIComponent(property.id)}`;

  return (
    <article className={cn(panel, "group flex flex-col overflow-hidden")}>
      <div className="relative">
        <Photo
          src={photo}
          alt={property.name}
          fallbackLabel={ti("noPhoto")}
          className="aspect-[16/9] w-full transition-transform duration-700 group-hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(28_11_10/0.85),rgb(28_11_10/0.1)_55%,transparent)]" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {property.city ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#141414]">
              {property.city}
            </span>
          ) : null}
          <span className="flex items-center gap-1 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur">
            <Icon name="photo_library" size={14} />
            {ti("photos", { count: photos })}
          </span>
        </div>
        <div className="absolute right-4 top-4 flex gap-2">
          <IconAction
            tone="glass"
            icon="edit"
            label={t("editTitle")}
            href={`${BASE}/${property.id}/edit`}
          />
          <IconAction
            tone="glass"
            icon="delete"
            label={t("deleteConfirm")}
            onClick={onDelete}
            disabled={deleteDisabled}
          />
        </div>
        <div className="absolute inset-x-4 bottom-4 text-white">
          <h3 className="text-2xl font-medium tracking-tight">
            {property.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-white/80">
            <Icon name="location_on" size={15} />
            {property.address}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="text-sm text-[#6b6b6b]">
              {ti("roomsVacant", { vacant: s.vacant, total: s.total })}
            </p>
            <p className="text-sm font-medium text-[#141414] tabular-nums">
              {s.total > 0 ? Math.round((s.occupied / s.total) * 100) : 0}%{" "}
              <span className="font-normal text-[#6b6b6b]">
                {ti("occupancy").toLowerCase()}
              </span>
            </p>
          </div>
          <VacancyMeter vacant={s.vacant} total={s.total} />
        </div>

        <dl className="grid grid-cols-3 gap-2">
          <MiniStat label={ti("roomTypes")} value={s.typeCount} />
          <MiniStat label={ti("rooms")} value={s.total} />
          <MiniStat
            label={ti("vacant")}
            value={s.vacant}
            tone={s.vacant > 0 ? "green" : undefined}
          />
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#faf7f6] px-4 py-3">
          <div>
            <p className="text-xs text-[#6b6b6b]">{ti("rentRoll")}</p>
            <p className="text-lg font-medium text-[#141414] tabular-nums">
              {rupiah(s.rentRoll)}
              <span className="ml-1 text-sm font-normal text-[#6b6b6b]">
                / {rupiah(s.potential)}
              </span>
            </p>
          </div>
          {s.fromMonthly !== null ? (
            <p className="rounded-full bg-white px-3 py-1.5 text-sm text-[#3d3a36]">
              {ti("from", { price: rupiah(s.fromMonthly) })}
              {ti("perMonth")}
            </p>
          ) : null}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Link
            href={`/admin/units${scoped}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#71130d] px-4 text-[15px] font-medium text-white transition-colors hover:bg-[#8a1a12]"
          >
            <Icon name="apartment" size={18} />
            {ti("openBuilding")}
          </Link>
          <Link
            href={`/admin/unit-types${scoped}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#ece4e2] bg-white px-4 text-[15px] font-medium text-[#141414] transition-colors hover:border-[#e8bfb9] hover:text-[#71130d]"
          >
            <Icon name="category" size={18} />
            {ti("roomTypes")}
          </Link>
        </div>
      </div>
    </article>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl px-3 py-2.5",
        tone === "green" ? "bg-[#eef8ec] text-[#1f5a2a]" : "bg-[#f6f0ef]",
      )}
    >
      <dt className="text-xs opacity-80">{label}</dt>
      <dd className="text-xl font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function BandStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-1 truncate text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-white/60">{hint}</p>
    </div>
  );
}

function OccupancyRing({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-16 shrink-0 -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="rgb(255 255 255 / 0.12)"
        strokeWidth="7"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="url(#ring)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(percent / 100) * c} ${c}`}
        className="transition-[stroke-dasharray] duration-700"
      />
      <defs>
        <linearGradient id="ring" x1="0" x2="1">
          <stop offset="0%" stopColor="#e8bfb9" />
          <stop offset="100%" stopColor="#d9534a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
