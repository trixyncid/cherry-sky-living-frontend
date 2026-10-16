"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AdminSearchInput,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { adminMenuItemClassName } from "@/features/admin/components/admin-menu";
import {
  useAdminLookups,
  type AdminLookups,
} from "@/features/admin/hooks/use-admin-lookups";
import {
  resolveUnitPropertyName,
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
} from "@/features/admin/lib/entity-display";
import {
  useUnit,
  useUnits,
} from "@/features/admin/hooks/use-admin-queries";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { Unit } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

function formatUnitLabel(unit: Unit, lookups: AdminLookups) {
  const unitType = resolveUnitTypeNameForUnit(unit, lookups);
  const property = resolveUnitPropertyName(unit, lookups);
  const suffix =
    property !== "—" ? ` (${unitType}) — ${property}` : ` (${unitType})`;
  return `${unit.name}${suffix}`;
}

type UnitComboboxProps = {
  id?: string;
  value: string;
  onChange: (unitId: string, unit?: Unit) => void;
  disabled?: boolean;
  required?: boolean;
};

export function UnitCombobox({
  id,
  value,
  onChange,
  disabled = false,
  required = false,
}: UnitComboboxProps) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.units");
  const tl = useTranslations("admin.pages.leases");
  const lookups = useAdminLookups();
  const listboxId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data: units = [], isLoading, isFetching } = useUnits(undefined, {
    enabled: open,
  });
  const { data: resolvedUnit } = useUnit(value, !!value);

  const filteredUnits = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return units;
    return units.filter((unit) => {
      const tenant = resolveUnitTenantLabel(unit);
      return (
        unit.name.toLowerCase().includes(q) ||
        resolveUnitTypeNameForUnit(unit, lookups)
          .toLowerCase()
          .includes(q) ||
        resolveUnitPropertyName(unit, lookups).toLowerCase().includes(q) ||
        tenant.toLowerCase().includes(q)
      );
    });
  }, [units, debouncedSearch, lookups]);

  const displayUnit = useMemo(() => {
    if (selectedUnit?.id === value) return selectedUnit;
    if (resolvedUnit) return resolvedUnit;
    return units.find((unit) => unit.id === value) ?? null;
  }, [selectedUnit, resolvedUnit, units, value]);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    setSearch("");
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedSearch]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function handleSelect(unit: Unit) {
    setSelectedUnit(unit);
    onChange(unit.id, unit);
    setOpen(false);
  }

  if (disabled) {
    return (
      <input
        id={id}
        readOnly
        disabled
        className={adminInputClassName}
        value={displayUnit ? formatUnitLabel(displayUnit, lookups) : value}
      />
    );
  }

  const showLoading = isLoading || (isFetching && units.length === 0);
  const emptyMessage = debouncedSearch.trim()
    ? tl("noUnitsMatch")
    : tp("empty");

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            className={cn(
              adminInputClassName,
              "relative flex h-11 cursor-pointer items-center pr-10 text-left",
              !displayUnit && "text-[#6b6b6b]",
            )}
          >
            <span className="truncate">
              {displayUnit
                ? formatUnitLabel(displayUnit, lookups)
                : t("selectUnit")}
            </span>
            <span
              className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-[#83746b]"
              aria-hidden
            >
              <Icon
                name="expand_more"
                size={20}
                className={cn("transition-transform", open && "rotate-180")}
              />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[18rem] p-0"
          align="start"
        >
          <div className="border-b border-[#e8ddd4] bg-[#faf9f6] p-2">
            <AdminSearchInput
              ref={searchRef}
              variant="menu"
              value={search}
              onChange={setSearch}
              placeholder={tp("searchPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) =>
                    Math.min(i + 1, filteredUnits.length - 1),
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Home") {
                  e.preventDefault();
                  setActiveIndex(0);
                } else if (e.key === "End") {
                  e.preventDefault();
                  setActiveIndex(Math.max(filteredUnits.length - 1, 0));
                } else if (e.key === "Enter" && filteredUnits[activeIndex]) {
                  e.preventDefault();
                  handleSelect(filteredUnits[activeIndex]);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
            />
          </div>

          <ul
            id={listboxId}
            role="listbox"
            className="max-h-72 overflow-y-auto p-1"
          >
            {showLoading ? (
              <li className="px-3 py-6 text-center text-sm text-[#83746b]">
                {t("loading")}
              </li>
            ) : filteredUnits.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[#83746b]">
                {emptyMessage}
              </li>
            ) : (
              filteredUnits.map((unit, index) => {
                const isSelected = unit.id === value;
                const isActive = index === activeIndex;
                const unitType = resolveUnitTypeNameForUnit(unit, lookups);
                const property = resolveUnitPropertyName(unit, lookups);

                return (
                  <li key={unit.id} role="presentation">
                    <button
                      ref={(node) => {
                        itemRefs.current[index] = node;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSelect(unit)}
                      className={adminMenuItemClassName({
                        active: isActive,
                        selected: isSelected,
                      })}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {unit.name}
                        </span>
                        <span className="block truncate text-xs text-[#83746b]">
                          {unitType}
                          {property !== "—" ? ` · ${property}` : ""}
                        </span>
                      </span>
                      {unit.status === "occupied" && (
                        <span className="shrink-0 text-xs text-[#83746b]">
                          {tp("status.occupied")}
                        </span>
                      )}
                      {isSelected && (
                        <Icon
                          name="check"
                          size={18}
                          className="shrink-0 text-[#71130d]"
                        />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>

      <input
        type="hidden"
        name={id ? `${id}-value` : undefined}
        value={value}
        required={required}
        tabIndex={-1}
        aria-hidden
        onChange={() => {}}
      />
    </>
  );
}
