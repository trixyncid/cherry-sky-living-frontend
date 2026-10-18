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
import { useAdminPropertyScope } from "@/features/admin/hooks/use-admin-property-scope";
import {
  useUnitTypeMutations,
  useUnitTypes,
} from "@/features/admin/hooks/use-admin-queries";
import {
  dailyOf,
  EmptyPanel,
  firstPhoto,
  IconAction,
  monthlyOf,
  Photo,
  panel,
  rupiah,
  SkeletonCards,
  type UnitTypeWithInventory,
  VacancyMeter,
} from "@/features/admin/inventory/inventory-kit";
import { countUnitTypeAttachments } from "@/features/admin/lib/attachments";
import { resolveUnitTypePropertyName } from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { Segmented } from "@/features/admin/overview/dashboard-widgets";
import { Link } from "@/i18n/routing";
import { isUnitOccupied, type UnitType } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const BASE = "/admin/unit-types";

type Row = {
  type: UnitTypeWithInventory;
  property: string;
  total: number;
  vacant: number;
  monthly: number | null;
  daily: number | null;
  perSqm: number | null;
  photo?: string;
};

/**
 * Room types — a product-style catalog: each type is a photo card with
 * size, live vacancy and its rate. "Compare" lines every type up side by
 * side (price per m² included) to sanity-check the pricing ladder.
 */
export function UnitTypesList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.unitTypes");
  const ti = useTranslations("admin.pages.inventory");
  const { propertyId, setPropertyId, ready, isAll, isScoped } =
    useAdminPropertyScope();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"catalog" | "compare">("catalog");
  const [vacancy, setVacancy] = useState<"" | "vacant" | "full">("");
  const tt = useTranslations("admin.toolbar");
  const {
    data = [],
    isLoading,
    isFetching,
    error,
  } = useUnitTypes(propertyId || undefined, ready);
  const mutations = useUnitTypeMutations();
  const deleteDialog = useDeleteDialog<UnitType>();
  const lookups = useAdminLookups();

  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase();
    return (data as UnitTypeWithInventory[])
      .filter(
        (row) =>
          !q ||
          [row.name, row.description ?? "", row.property?.name ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .map((type) => {
        const units = type.units ?? [];
        const total = units.length || type._count?.units || 0;
        const vacant = units.filter((u) => !isUnitOccupied(u.status)).length;
        const monthly = monthlyOf(type.pricings);
        return {
          type,
          property: resolveUnitTypePropertyName(type, lookups),
          total,
          vacant,
          monthly,
          daily: dailyOf(type.pricings),
          perSqm:
            monthly !== null && type.size
              ? Math.round(monthly / type.size)
              : null,
          photo: firstPhoto(type.unitTypeAttachments),
        };
      })
      .sort(
        (a, b) =>
          a.property.localeCompare(b.property) ||
          (a.monthly ?? Number.MAX_SAFE_INTEGER) -
            (b.monthly ?? Number.MAX_SAFE_INTEGER) ||
          a.type.name.localeCompare(b.type.name),
      )
      .filter((r) =>
        vacancy === "vacant"
          ? r.vacant > 0
          : vacancy === "full"
            ? r.total > 0 && r.vacant === 0
            : true,
      );
  }, [data, search, lookups, vacancy]);

  const groups = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const list = map.get(r.property);
      if (list) list.push(r);
      else map.set(r.property, [r]);
    }
    return [...map.entries()];
  }, [rows]);

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
  const propertyToolbar = usePropertyToolbarFilter(propertyId, setPropertyId, {
    allLabel: tp("allPropertiesInventory"),
  });
  const showLoading = !ready || isLoading || (isFetching && data.length === 0);
  const createHref = isScoped
    ? `${BASE}/new?propertyId=${encodeURIComponent(propertyId)}`
    : `${BASE}/new`;
  const maxMonthly = Math.max(1, ...rows.map((r) => r.monthly ?? 0));

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={{ label: t("add"), href: createHref, icon: "add" }}
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
            key: "vacancy",
            label: tt("availability"),
            active: vacancy !== "",
            chip: vacancy === "vacant" ? tt("hasVacancy") : tt("full"),
            onClear: () => setVacancy(""),
            width: "w-44",
            control: (
              <AdminSelect
                value={vacancy}
                onChange={(e) => setVacancy(e.target.value as typeof vacancy)}
              >
                <option value="">{tt("any")}</option>
                <option value="vacant">{tt("hasVacancy")}</option>
                <option value="full">{tt("full")}</option>
              </AdminSelect>
            ),
          },
        ]}
        trailing={
          <Segmented
            label={ti("view")}
            value={view}
            onChange={setView}
            options={[
              { id: "catalog", label: ti("catalog") },
              { id: "compare", label: ti("compare") },
            ]}
          />
        }
        resultCount={showLoading ? undefined : rows.length}
      />

      {error ? (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      ) : null}

      {showLoading ? (
        <SkeletonCards count={3} className="sm:grid-cols-2 xl:grid-cols-3" />
      ) : rows.length === 0 ? (
        <EmptyPanel
          icon="category"
          title={isAll ? tp("emptyInventory") : tp("emptyScoped")}
          action={
            <Link
              href={createHref}
              className="admin-btn-primary mt-2 inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium"
            >
              <Icon name="add" size={18} />
              {t("add")}
            </Link>
          }
        />
      ) : view === "catalog" ? (
        <div className="space-y-8">
          {groups.map(([property, list]) => (
            <section key={property}>
              {isAll || groups.length > 1 ? (
                <h3 className="mb-3 flex items-center gap-2 text-lg font-medium text-[#141414]">
                  <Icon name="apartment" size={20} className="text-[#71130d]" />
                  {property}
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-normal text-[#6b6b6b]">
                    {ti("typesCount", { count: list.length })}
                  </span>
                </h3>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((row) => (
                  <TypeCard
                    key={row.type.id}
                    row={row}
                    onDelete={() => deleteDialog.openDelete(row.type)}
                    deleteDisabled={pending}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className={cn(panel, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left">
              <thead className="bg-[#faf7f6] text-[13px] text-[#6b6b6b]">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    {ti("roomType")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {ti("size")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {ti("availability")}
                  </th>
                  <th scope="col" className="w-[28%] px-4 py-3 font-medium">
                    {ti("monthly")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {ti("daily")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {ti("perSqmLabel")}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">{t("actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.type.id}
                    className="border-t border-[#f1ebea] text-[15px] text-[#141414] hover:bg-[#fcf9f8]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Photo
                          src={row.photo}
                          alt=""
                          sizes="48px"
                          className="size-11 shrink-0 rounded-xl"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {row.type.name}
                          </p>
                          <p className="truncate text-xs text-[#6b6b6b]">
                            {row.property}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.type.size != null ? `${row.type.size} m²` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm tabular-nums">
                        {ti("roomsVacant", {
                          vacant: row.vacant,
                          total: row.total,
                        })}
                      </p>
                      <VacancyMeter
                        vacant={row.vacant}
                        total={row.total}
                        className="mt-1.5 h-1.5 w-28"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {row.monthly !== null ? (
                        <div className="flex items-center gap-3">
                          <span className="w-20 shrink-0 font-medium tabular-nums">
                            {rupiah(row.monthly)}
                          </span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#f6f0ef]">
                            <span
                              className="block h-full rounded-full bg-[linear-gradient(90deg,#e8bfb9,#71130d)]"
                              style={{
                                width: `${(row.monthly / maxMonthly) * 100}%`,
                              }}
                            />
                          </span>
                        </div>
                      ) : (
                        <NoPrice row={row} />
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.daily !== null ? rupiah(row.daily) : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[#3d3a36]">
                      {row.perSqm !== null ? rupiah(row.perSqm) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <IconAction
                          icon="edit"
                          label={t("editTitle")}
                          href={`${BASE}/${row.type.id}/edit`}
                        />
                        <IconAction
                          icon="delete"
                          tone="danger"
                          label={t("deleteConfirm")}
                          onClick={() => deleteDialog.openDelete(row.type)}
                          disabled={pending}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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

function pricingHref(row: Row) {
  const own = row.type.pricings?.[0];
  return own
    ? `/admin/pricing/${own.id}/edit`
    : `/admin/pricing/new?propertyId=${encodeURIComponent(row.type.propertyId)}&unitTypeId=${encodeURIComponent(row.type.id)}`;
}

function NoPrice({ row }: { row: Row }) {
  const ti = useTranslations("admin.pages.inventory");
  return (
    <Link
      href={pricingHref(row)}
      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#c97f76] px-3 py-1 text-sm text-[#71130d] hover:bg-[#fbf3f2]"
    >
      <Icon name="sell" size={15} />
      {ti("setPrice")}
    </Link>
  );
}

function TypeCard({
  row,
  onDelete,
  deleteDisabled,
}: {
  row: Row;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  const t = useTranslations("admin.crud");
  const ti = useTranslations("admin.pages.inventory");
  const { type } = row;
  const photos = countUnitTypeAttachments(type);
  const full = row.total > 0 && row.vacant === 0;

  return (
    <article className={cn(panel, "group flex flex-col overflow-hidden")}>
      <div className="relative">
        <Photo
          src={row.photo}
          alt={type.name}
          fallbackLabel={ti("noPhoto")}
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {type.size != null ? (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-[#141414]">
              <Icon name="square_foot" size={14} />
              {type.size} m²
            </span>
          ) : null}
          {photos > 1 ? (
            <span className="flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-xs text-white backdrop-blur">
              <Icon name="photo_library" size={14} />
              {photos}
            </span>
          ) : null}
        </div>
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold",
            full ? "bg-[#71130d] text-white" : "bg-[#dff3d6] text-[#1f5a2a]",
          )}
        >
          {full ? ti("full") : ti("vacantCount", { count: row.vacant })}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h4 className="text-lg font-medium tracking-tight text-[#141414]">
            {type.name}
          </h4>
          {type.description ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-[#6b6b6b]">
              {type.description}
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 text-xs text-[#6b6b6b]">
            {ti("roomsVacant", { vacant: row.vacant, total: row.total })}
          </p>
          <VacancyMeter vacant={row.vacant} total={row.total} />
        </div>

        <div className="flex items-end justify-between gap-2 rounded-2xl bg-[#faf7f6] px-4 py-3">
          {row.monthly !== null ? (
            <div>
              <p className="text-xl font-medium text-[#141414] tabular-nums">
                {rupiah(row.monthly)}
                <span className="text-sm font-normal text-[#6b6b6b]">
                  {ti("perMonth")}
                </span>
              </p>
              <p className="text-xs text-[#6b6b6b] tabular-nums">
                {row.daily !== null
                  ? `${rupiah(row.daily)}${ti("perDay")}`
                  : ti("noDaily")}
                {row.perSqm !== null
                  ? ` · ${ti("perSqm", { price: rupiah(row.perSqm) })}`
                  : ""}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-[#a1271b]">
                {ti("noPrice")}
              </p>
              <p className="text-xs text-[#6b6b6b]">{ti("missingHint")}</p>
            </div>
          )}
          <Link
            href={pricingHref(row)}
            className="shrink-0 text-sm font-medium text-[#71130d] underline-offset-4 hover:underline"
          >
            {row.monthly !== null ? ti("editPrice") : ti("setPrice")}
          </Link>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Link
            href={`/admin/units?propertyId=${encodeURIComponent(type.propertyId)}`}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[#ece4e2] bg-white px-4 text-sm font-medium text-[#141414] transition-colors hover:border-[#e8bfb9] hover:text-[#71130d]"
          >
            <Icon name="apartment" size={17} />
            {ti("viewRooms")}
          </Link>
          <IconAction
            icon="edit"
            label={t("editTitle")}
            href={`${BASE}/${type.id}/edit`}
          />
          <IconAction
            icon="delete"
            tone="danger"
            label={t("deleteConfirm")}
            onClick={onDelete}
            disabled={deleteDisabled}
          />
        </div>
      </div>
    </article>
  );
}
