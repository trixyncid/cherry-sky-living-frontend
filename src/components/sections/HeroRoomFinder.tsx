/**
 * Hero room finder (§5.2) — segmented Residence | Move-in | Budget bar with
 * menus, quick toggles, and a submit button that previews the live number
 * of matching room types before the visitor leaves the page.
 * Matching is computed from the property data already on the page;
 * the rooms page then applies the same filters server-side.
 */

"use client";

import {
  addDays,
  addMonths,
  format,
  startOfMonth,
  startOfToday,
} from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import {
  filtersFromPriceBand,
  filtersToQueryString,
  type SearchPriceBand,
} from "@/lib/api/public/search-contract";
import type { Kost, RoomType, SearchFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

type MoveIn = "any" | "week" | "nextMonth" | `date:${string}`;

const BANDS: { id: SearchPriceBand; labelKey: string }[] = [
  { id: "any", labelKey: "finder.anyBudget" },
  { id: "under1", labelKey: "search.priceUnder1m" },
  { id: "1to2", labelKey: "search.price1to2m" },
  { id: "2to3", labelKey: "search.price2to3m" },
  { id: "3plus", labelKey: "search.price3mPlus" },
];

function monthlyPrice(rt: RoomType): number {
  return rt.pricings?.find((p) => p.durationDays === 30)?.price ?? rt.price;
}

function inBand(price: number, band: SearchPriceBand): boolean {
  if (band === "any") return true;
  if (price <= 0) return false;
  const { priceMin, priceMax } = filtersFromPriceBand(band);
  return (
    (priceMin === undefined || price >= priceMin) &&
    (priceMax === undefined || price <= priceMax)
  );
}

function moveInRange(moveIn: MoveIn): { start: Date; end: Date } | null {
  const today = startOfToday();
  if (moveIn === "week")
    return { start: addDays(today, 1), end: addDays(today, 31) };
  if (moveIn === "nextMonth") {
    const start = startOfMonth(addMonths(today, 1));
    return { start, end: addDays(start, 30) };
  }
  if (moveIn.startsWith("date:")) {
    const start = new Date(`${moveIn.slice(5)}T00:00:00`);
    return { start, end: addDays(start, 30) };
  }
  return null;
}

/** One segment of the bar: label + current value, opens a menu. */
function Segment({
  icon,
  label,
  value,
  children,
  className,
}: {
  icon: string;
  label: string;
  value: string;
  children: (close: () => void) => ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 rounded-full px-4 py-2 text-left sm:px-3.5 transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none data-[state=open]:bg-white/15",
            className,
          )}
        >
          <Icon name={icon} size={20} className="shrink-0 text-white/65" />
          <span className="min-w-0">
            <span className="block text-xs text-white/60">{label}</span>
            <span className="block truncate text-[15px] font-medium text-white">
              {value}
            </span>
          </span>
          {/* Wrapper carries the breakpoint: the icon font's CSS sets display. */}
          <span className="ml-auto shrink-0 sm:hidden">
            <Icon name="expand_more" size={18} className="text-white/50" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 rounded-2xl p-2">
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

function Option({
  selected,
  disabled,
  onClick,
  label,
  meta,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        selected
          ? "bg-[#71130d] text-white"
          : "text-[#141414] hover:bg-[#f6f0ef]",
      )}
    >
      <span className="flex-1">{label}</span>
      {meta ? (
        <span
          className={cn(
            "text-xs",
            selected ? "text-white/75" : "text-[#6b6b6b]",
          )}
        >
          {meta}
        </span>
      ) : null}
      {selected ? <Icon name="check" size={16} /> : null}
    </button>
  );
}

export function HeroRoomFinder({ kosts = [] }: { kosts?: Kost[] }) {
  const t = useTranslations("hero");
  const tAll = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [propertyId, setPropertyId] = useState("");
  const [moveIn, setMoveIn] = useState<MoveIn>("any");
  const [band, setBand] = useState<SearchPriceBand>("any");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [monthly, setMonthly] = useState(false);

  const all = useMemo(
    () =>
      kosts.flatMap((k) =>
        k.roomTypes.filter((rt) => rt.totalCount > 0).map((rt) => ({ k, rt })),
      ),
    [kosts],
  );

  // Availability is approximated with "rooms vacant now"; the rooms page
  // applies exact date-based availability server-side.
  const needsOpen = availableOnly || moveIn !== "any";
  const matches = (opts: { property?: string; priceBand?: SearchPriceBand }) =>
    all.filter(
      ({ k, rt }) =>
        (!(opts.property ?? propertyId) ||
          k.id === (opts.property ?? propertyId)) &&
        inBand(monthlyPrice(rt), opts.priceBand ?? band) &&
        (!needsOpen || rt.availableCount > 0) &&
        (!monthly || (rt.pricings ?? []).some((p) => p.durationDays === 30)),
    );

  const current = matches({});
  const roomsOpen = current.reduce((s, m) => s + m.rt.availableCount, 0);

  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });
  const moveInLabel =
    moveIn === "any"
      ? t("finder.anyTime")
      : moveIn === "week"
        ? t("finder.thisWeek")
        : moveIn === "nextMonth"
          ? t("finder.nextMonth")
          : dateFmt.format(new Date(`${moveIn.slice(5)}T00:00:00`));
  const residenceLabel =
    kosts.find((k) => k.id === propertyId)?.name ?? t("finder.anyShort");
  const bandKey =
    BANDS.find((b) => b.id === band)?.labelKey ?? "finder.anyBudget";
  const bandLabel =
    band === "any"
      ? t("finder.anyShort")
      : bandKey.startsWith("finder.")
        ? t(bandKey)
        : tAll(bandKey);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const filters: SearchFilters = {
      page: 1,
      propertyId: propertyId || undefined,
      ...filtersFromPriceBand(band),
      availability: needsOpen ? "available" : "all",
      durationDays: monthly ? 30 : undefined,
    };
    const range = moveInRange(moveIn);
    if (range) {
      filters.startDate = format(range.start, "yyyy-MM-dd");
      filters.endDate = format(range.end, "yyyy-MM-dd");
    }
    track("filter_used", {
      location: "hero_finder",
      property: propertyId || "all",
      budget: band,
      move_in:
        moveIn === "any" ? "any" : moveIn.startsWith("date:") ? "date" : moveIn,
      results: current.length,
    });
    const qs = filtersToQueryString(filters);
    router.push(qs ? `/search-kosts?${qs}` : "/search-kosts");
  };

  const toggle = (on: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
        on
          ? "border-white bg-white text-[#141414]"
          : "border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/10",
      )}
    >
      <Icon name={on ? "check" : "add"} size={16} />
      {label}
    </button>
  );

  return (
    <form
      onSubmit={submit}
      aria-label={t("finder.ariaFinder")}
      className="w-full max-w-[50rem]"
    >
      <div className="flex flex-col gap-1 rounded-[1.75rem] border border-white/20 bg-white/[0.12] p-1.5 backdrop-blur-md sm:flex-row sm:items-center sm:rounded-full">
        <Segment
          icon="apartment"
          label={t("finder.residence")}
          value={residenceLabel}
        >
          {(close) => (
            <>
              <Option
                selected={!propertyId}
                onClick={() => {
                  setPropertyId("");
                  close();
                }}
                label={t("finder.anyResidence")}
                meta={t("finder.typesCount", {
                  count: matches({ property: "" }).length,
                })}
              />
              {kosts.map((k) => (
                <Option
                  key={k.id}
                  selected={propertyId === k.id}
                  onClick={() => {
                    setPropertyId(k.id);
                    close();
                  }}
                  label={k.name}
                  meta={t("finder.openCount", { count: k.availableRooms })}
                />
              ))}
            </>
          )}
        </Segment>
        <span
          aria-hidden
          className="mx-1 hidden h-8 w-px bg-white/15 sm:block"
        />
        <Segment icon="event" label={t("finder.moveIn")} value={moveInLabel}>
          {(close) => (
            <>
              {(["any", "week", "nextMonth"] as const).map((id) => (
                <Option
                  key={id}
                  selected={moveIn === id}
                  onClick={() => {
                    setMoveIn(id);
                    close();
                  }}
                  label={
                    id === "any"
                      ? t("finder.anyTime")
                      : id === "week"
                        ? t("finder.thisWeek")
                        : t("finder.nextMonth")
                  }
                />
              ))}
              <label className="mt-1 block border-t border-[#efeeeb] px-3 pb-1 pt-3 text-xs text-[#6b6b6b]">
                {t("finder.pickDate")}
                <input
                  type="date"
                  min={format(addDays(startOfToday(), 1), "yyyy-MM-dd")}
                  value={moveIn.startsWith("date:") ? moveIn.slice(5) : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setMoveIn(`date:${e.target.value}`);
                      close();
                    }
                  }}
                  className="mt-1.5 block h-11 w-full rounded-xl border border-[#cfc5c1] bg-white px-3 text-base sm:text-[15px] text-[#141414] focus:border-[#71130d] focus:outline-none"
                />
              </label>
            </>
          )}
        </Segment>
        <span
          aria-hidden
          className="mx-1 hidden h-8 w-px bg-white/15 sm:block"
        />
        <Segment icon="payments" label={t("finder.budget")} value={bandLabel}>
          {(close) =>
            BANDS.map((b) => {
              const count = matches({ priceBand: b.id }).length;
              return (
                <Option
                  key={b.id}
                  selected={band === b.id}
                  disabled={b.id !== "any" && count === 0}
                  onClick={() => {
                    setBand(b.id);
                    close();
                  }}
                  label={
                    b.labelKey.startsWith("finder.")
                      ? t(b.labelKey)
                      : tAll(b.labelKey)
                  }
                  meta={t("finder.typesCount", { count })}
                />
              );
            })
          }
        </Segment>
        <button
          type="submit"
          disabled={current.length === 0}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#71130d] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#8a1a12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/70"
        >
          <Icon name="search" size={18} />
          <span className="whitespace-nowrap tabular-nums">
            {current.length > 0
              ? t("finder.show", { count: current.length })
              : t("finder.none")}
          </span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {toggle(
          availableOnly,
          () => setAvailableOnly((v) => !v),
          t("finder.availableNow"),
        )}
        {toggle(monthly, () => setMonthly((v) => !v), t("finder.monthly"))}
        <p
          aria-live="polite"
          className="w-full pt-1 text-sm text-white/70 sm:w-auto sm:pl-2 sm:pt-0"
        >
          {current.length > 0
            ? t("finder.summary", { rooms: roomsOpen, types: current.length })
            : t("finder.noneHint")}
        </p>
      </div>
    </form>
  );
}
