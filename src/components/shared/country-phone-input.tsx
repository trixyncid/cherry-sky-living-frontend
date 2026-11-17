"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  COUNTRIES,
  type CountryDial,
  countryByIso,
  countryName,
  DEFAULT_COUNTRY_ISO,
  flagEmoji,
  splitE164,
} from "@/lib/countries";
import { cn } from "@/lib/utils";

type CountryPhoneInputProps = {
  id: string;
  /** E.164 ("+6281234567890") or "" — what gets stored and sent. */
  value: string;
  onChange: (e164: string) => void;
  /** "lg" matches the sign-in fields; "md" the admin/profile inputs. */
  size?: "lg" | "md";
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
};

/** Digits typed after the country code, without the local trunk "0". */
function composeE164(country: CountryDial, national: string): string {
  const digits = national.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `+${country.dial}${digits}` : "";
}

function fromValue(value: string, preferIso?: string) {
  const split = value ? splitE164(value, preferIso) : null;
  if (split) return { iso: split.country.iso, national: split.national };
  return { iso: preferIso ?? DEFAULT_COUNTRY_ISO, national: value };
}

/**
 * Phone number with a searchable country-code picker (default +62). Emits the
 * full international number, e.g. +62 + "0812 3456 7890" → "+6281234567890".
 */
export function CountryPhoneInput({
  id,
  value,
  onChange,
  size = "md",
  autoComplete = "tel-national",
  required,
  disabled,
  placeholder,
  "aria-label": ariaLabel,
}: CountryPhoneInputProps) {
  const t = useTranslations("common.countryPicker");
  const [iso, setIso] = useState(() => fromValue(value).iso);
  const [national, setNational] = useState(() => fromValue(value).national);
  const lastEmitted = useRef(value);
  const country = countryByIso(iso);

  // Follow outside changes (form reset, data loaded) but not our own echoes.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const next = fromValue(value, iso);
    setIso(next.iso);
    setNational(next.national);
    lastEmitted.current = value;
  }, [value, iso]);

  function emit(nextCountry: CountryDial, nextNational: string) {
    const e164 = composeE164(nextCountry, nextNational);
    lastEmitted.current = e164;
    onChange(e164);
  }

  function handleNationalChange(raw: string) {
    // Pasted/typed a full international number: pick its country.
    const trimmed = raw.trim();
    if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
      const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
      const split = splitE164(`+${digits}`, iso);
      if (split?.national) {
        setIso(split.country.iso);
        setNational(split.national);
        emit(split.country, split.national);
        return;
      }
    }
    setNational(raw);
    emit(country, raw);
  }

  const lg = size === "lg";

  return (
    <div
      className={cn(
        "group flex w-full items-stretch overflow-hidden border bg-white transition-[border-color,box-shadow]",
        "focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10",
        lg
          ? "h-[3.25rem] rounded-2xl border-line-strong shadow-[0_1px_2px_rgb(11_11_13/0.04)] hover:border-fg-faint"
          : "glass-control h-11 rounded-xl",
        disabled && "opacity-60",
      )}
    >
      <CountryPicker
        country={country}
        disabled={disabled}
        lg={lg}
        label={t("label")}
        onSelect={(next) => {
          setIso(next.iso);
          emit(next, national);
        }}
      />
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        aria-label={ariaLabel}
        placeholder={
          placeholder ?? (country.iso === "ID" ? "812 3456 7890" : undefined)
        }
        value={national}
        onChange={(e) => handleNationalChange(e.target.value)}
        className={cn(
          "min-w-0 flex-1 bg-transparent pr-4 pl-3 text-fg tabular-nums placeholder:text-fg-faint focus:outline-none",
          lg ? "text-[15px]" : "text-base sm:text-[15px]",
        )}
      />
    </div>
  );
}

function CountryPicker({
  country,
  onSelect,
  disabled,
  lg,
  label,
}: {
  country: CountryDial;
  onSelect: (country: CountryDial) => void;
  disabled?: boolean;
  lg: boolean;
  label: string;
}) {
  const t = useTranslations("common.countryPicker");
  const locale = useLocale();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => {
    const named = COUNTRIES.map((c) => ({
      ...c,
      name: countryName(c.iso, locale),
    }));
    named.sort((a, b) => {
      // Indonesia stays on top; everything else alphabetical.
      if (a.iso === DEFAULT_COUNTRY_ISO) return -1;
      if (b.iso === DEFAULT_COUNTRY_ISO) return 1;
      return a.name.localeCompare(b.name, locale);
    });
    return named;
  }, [locale]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    const digits = q.replace(/\D/g, "");
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase() === q ||
        (digits && c.dial.startsWith(digits)),
    );
  }, [query, sorted]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const i = sorted.findIndex((c) => c.iso === country.iso);
    setActive(Math.max(i, 0));
  }, [open, sorted, country.iso]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(c: CountryDial) {
    onSelect(c);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`${label}: ${countryName(country.iso, locale)} +${country.dial}`}
          className={cn(
            "flex shrink-0 items-center gap-1.5 border-r border-line pl-3.5 pr-2.5 text-fg transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:outline-none",
            lg ? "text-[15px]" : "text-sm",
          )}
        >
          <span aria-hidden className="text-lg leading-none">
            {flagEmoji(country.iso)}
          </span>
          <span className="font-medium tabular-nums">+{country.dial}</span>
          <Icon name="expand_more" size={18} className="text-fg-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-0">
        <div className="border-b border-line p-2">
          <div className="relative">
            <Icon
              name="search"
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
            />
            <input
              // biome-ignore lint/a11y/noAutofocus: focus the search when the picker opens
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={
                results[active] ? `${listId}-${results[active].iso}` : undefined
              }
              aria-label={t("search")}
              placeholder={t("search")}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const pick = results[active];
                  if (pick) choose(pick);
                }
              }}
              className="h-10 w-full rounded-xl bg-subtle pl-9 pr-3 text-base text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-brand/20 sm:text-sm"
            />
          </div>
        </div>
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="max-h-72 overflow-y-auto p-1.5"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-fg-muted">
              {t("noResults")}
            </p>
          ) : (
            results.map((c, i) => {
              const selected = c.iso === country.iso;
              return (
                <div
                  key={c.iso}
                  id={`${listId}-${c.iso}`}
                  data-index={i}
                  role="option"
                  tabIndex={-1}
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(c)}
                  onKeyDown={() => {}}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                    i === active ? "bg-hover" : "",
                    selected && "font-semibold text-brand",
                  )}
                >
                  <span aria-hidden className="text-lg leading-none">
                    {flagEmoji(c.iso)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="shrink-0 tabular-nums text-fg-muted">
                    +{c.dial}
                  </span>
                  {selected ? (
                    <Icon name="check" size={16} className="shrink-0" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
