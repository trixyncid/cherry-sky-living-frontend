/**
 * Availability search bar + results. Native selects (keyboard and screen
 * reader friendly), instant client-side filtering, filters kept in the URL.
 * No match → a waitlist form that saves the filters used.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { RoomTile } from "@/components/kost/RoomTile";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { Icon } from "@/components/shared/Icon";
import { track } from "@/lib/analytics";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { formatCurrency } from "@/lib/utils/format";
import { Dropdown } from "./Dropdown";
import {
  BUDGETS,
  describeFilters,
  EMPTY_FILTERS,
  isFiltered,
  type Match,
  type SearchFilters,
} from "./search";
import { monthlyPrice, type PropertyVM } from "./shared";

export function SearchBar({
  properties,
  filters,
  update,
  onSubmit,
}: {
  properties: PropertyVM[];
  filters: SearchFilters;
  update: (patch: Partial<SearchFilters>) => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("landing.search");
  const locale = useLocale();
  const scoped = properties.filter(
    (p) => filters.property === "all" || p.key === filters.property,
  );
  const roomTypes = [
    ...new Set(
      scoped.flatMap(
        (p) =>
          p.kost?.roomTypes
            .filter((r) => r.totalCount > 0)
            .map((r) => r.name) ?? [],
      ),
    ),
  ];
  const hasGender = properties.some((p) => p.content.gender);
  // Move-in: the next twelve months (plus a previously shared value, if any).
  const months = useMemo(() => {
    const format = new Intl.DateTimeFormat(
      locale === "en" ? "en-GB" : "id-ID",
      {
        month: "long",
        year: "numeric",
      },
    );
    const now = new Date();
    const list = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return {
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: format.format(d),
      };
    });
    if (filters.moveIn && !list.some((m) => m.value === filters.moveIn)) {
      const [y, m] = filters.moveIn.split("-").map(Number);
      list.unshift({
        value: filters.moveIn,
        label: format.format(new Date(y ?? now.getFullYear(), (m ?? 1) - 1, 1)),
      });
    }
    return list;
  }, [locale, filters.moveIn]);

  return (
    <form
      aria-label={t("title")}
      onSubmit={(e) => {
        e.preventDefault();
        track("search_submit", { ...filters });
        onSubmit();
      }}
      className="grid grid-cols-2 gap-3 rounded-[1.75rem] border border-white/20 bg-white/[0.1] p-4 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)] backdrop-blur-2xl lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] lg:items-end lg:rounded-full lg:p-3 lg:pl-6"
    >
      <Dropdown
        id="lp-property"
        label={t("property")}
        value={filters.property}
        onChange={(v) =>
          update({ property: v as SearchFilters["property"], roomType: "" })
        }
        options={[
          { value: "all", label: t("all") },
          ...properties.map((p) => ({ value: p.key, label: p.name })),
        ]}
      />
      <Dropdown
        id="lp-room"
        label={t("roomType")}
        value={filters.roomType}
        onChange={(v) => update({ roomType: v })}
        options={[
          { value: "", label: t("any") },
          ...roomTypes.map((name) => ({ value: name, label: name })),
        ]}
      />
      <Dropdown
        id="lp-movein"
        label={t("moveIn")}
        value={filters.moveIn}
        onChange={(v) => update({ moveIn: v })}
        options={[{ value: "", label: t("anyTime") }, ...months]}
      />
      <Dropdown
        id="lp-duration"
        label={t("duration")}
        value={filters.duration}
        onChange={(v) => update({ duration: v as SearchFilters["duration"] })}
        options={[
          { value: "", label: t("any") },
          ...(["1", "3", "6", "12"] as const).map((d) => ({
            value: d,
            label: t("months", { count: Number(d) }),
          })),
        ]}
      />
      <Dropdown
        id="lp-budget"
        className="col-span-2 lg:col-span-1"
        label={t("budget")}
        value={filters.budget ? String(filters.budget) : ""}
        onChange={(v) => update({ budget: Number(v) || 0 })}
        options={[
          { value: "", label: t("any") },
          ...BUDGETS.map((b) => ({
            value: String(b),
            label: `≤ ${formatCurrency(b, { compact: true })}`,
          })),
        ]}
      />
      {hasGender ? (
        <Dropdown
          id="lp-gender"
          className="col-span-2 lg:hidden"
          label={t("gender")}
          value={filters.gender}
          onChange={(v) => update({ gender: v as SearchFilters["gender"] })}
          options={[
            { value: "", label: t("any") },
            { value: "putra", label: t("putra") },
            { value: "putri", label: t("putri") },
            { value: "campur", label: t("campur") },
          ]}
        />
      ) : null}
      <button
        type="submit"
        className="col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-ink transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink lg:col-span-1"
      >
        <Icon name="search" size={18} />
        {t("submit")}
      </button>
    </form>
  );
}

export function SearchResults({
  properties,
  filters,
  matches,
  update,
  loading,
}: {
  properties: PropertyVM[];
  filters: SearchFilters;
  matches: Match[];
  update: (patch: Partial<SearchFilters>) => void;
  loading: boolean;
}) {
  const t = useTranslations("landing.search");
  const locale = useLocale();
  const open = matches.filter((m) => m.room.availableCount > 0);
  const summary = describeFilters(filters, properties, locale);

  return (
    <section
      id="hasil"
      aria-labelledby="hasil-heading"
      className="scroll-mt-20 bg-canvas px-5 py-12 sm:px-8 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[90rem]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="hasil-heading"
              className="text-[clamp(1.6rem,2.4vw,2.2rem)] font-semibold tracking-tight text-fg"
              aria-live="polite"
            >
              {loading ? t("loading") : t("results", { count: open.length })}
            </h2>
            {summary ? <p className="mt-1 text-fg-muted">{summary}</p> : null}
          </div>
          {isFiltered(filters) ? (
            <button
              type="button"
              onClick={() => update(EMPTY_FILTERS)}
              className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              {t("reset")}
            </button>
          ) : null}
        </div>

        {!loading && matches.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {matches.map(({ vm, room }) =>
              vm.kost ? (
                <RoomTile
                  key={room.id}
                  roomTypeId={room.id}
                  propertyId={vm.kost.id}
                  name={room.name}
                  propertyName={vm.name}
                  city={vm.kost.location.city}
                  image={room.images[0] || vm.kost.thumbnail}
                  availableCount={room.availableCount}
                  totalCount={room.totalCount}
                  monthlyPrice={monthlyPrice(room)}
                  deposit={vm.kost.deposit}
                  whatsappNumber={
                    vm.kost.whatsappNumber || getContactWhatsAppNumber()
                  }
                  tags={room.size ? [`${room.size} m²`] : []}
                />
              ) : null,
            )}
          </div>
        ) : null}

        {!loading && open.length === 0 ? (
          <div className="mt-6 flex flex-col items-start gap-4 rounded-[1.5rem] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-fg">{t("emptyTitle")}</p>
              <p className="mt-1 text-fg-muted">{t("emptyBody")}</p>
            </div>
            <LeadDialog
              type="waitlist"
              kosts={properties.flatMap((p) => (p.kost ? [p.kost] : []))}
              propertyId={
                properties.find((p) => p.key === filters.property)?.kost?.id
              }
              initialMessage={
                summary ? `${t("waitlistPrefix")} ${summary}` : ""
              }
              trigger={
                <button
                  type="button"
                  onClick={() => track("waitlist_join", { ...filters })}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-hover"
                >
                  <Icon name="notifications" size={18} />
                  {t("waitlistCta")}
                </button>
              }
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
