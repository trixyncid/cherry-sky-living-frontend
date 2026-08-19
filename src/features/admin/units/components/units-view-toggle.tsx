"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";

export type UnitsViewMode = "map" | "table";

export function UnitsViewToggle({
  value,
  onChange,
}: {
  value: UnitsViewMode;
  onChange: (mode: UnitsViewMode) => void;
}) {
  const t = useTranslations("admin.pages.units");

  const options: { mode: UnitsViewMode; icon: string; label: string }[] = [
    { mode: "map", icon: "grid_view", label: t("mapView") },
    { mode: "table", icon: "table_rows", label: t("tableView") },
  ];

  return (
    <div
      className="glass-panel inline-flex rounded-xl p-1"
      role="tablist"
      aria-label={t("viewMode")}
    >
      {options.map(({ mode, icon, label }) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            value === mode
              ? "admin-btn-primary shadow-sm"
              : "text-[#51443c] hover:bg-white/50",
          )}
        >
          <Icon name={icon} size={18} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
