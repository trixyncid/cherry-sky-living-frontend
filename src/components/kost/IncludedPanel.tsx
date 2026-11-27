"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

const INCLUDED = [
  { key: "extra.furnished.title", icon: "bed" },
  { key: "items.wifi.title", icon: "wifi" },
  { key: "items.ac.title", icon: "ac_unit" },
  { key: "items.security.title", icon: "shield_lock" },
  { key: "items.parking.title", icon: "local_parking" },
  { key: "extra.support.title", icon: "forum" },
] as const;

/** What rent covers vs. what's paid separately (§5.8, §7.4). */
export function IncludedPanel({
  deposit,
  className,
}: {
  /** Property-specific refundable deposit; falls back to the general copy. */
  deposit?: number;
  className?: string;
}) {
  const t = useTranslations("home.amenities");
  const tDetail = useTranslations("detail");

  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-lg border border-line bg-panel sm:grid-cols-[1.2fr_1fr]",
        className,
      )}
    >
      <div className="p-6">
        <p className="eyebrow mb-5 flex items-center gap-3 text-fg-muted">
          <span className="size-2 rounded-full bg-success" />
          {t("included")}
        </p>
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-2 text-[15px] text-fg"
            >
              <Icon name={item.icon} size={18} className="text-fg-muted" />
              {t(item.key)}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3 border-t border-line bg-subtle p-6 sm:border-l sm:border-t-0">
        <p className="eyebrow mb-2 flex items-center gap-3 text-fg-muted">
          <span aria-hidden className="h-px w-6 bg-fg/30" />
          {t("paidSeparately")}
        </p>
        <p className="text-[15px] leading-relaxed text-fg-2">
          {t("electricity")}
        </p>
        <p className="text-[15px] leading-relaxed text-fg-2">
          {deposit
            ? tDetail("depositFor", { amount: formatCurrency(deposit) })
            : t("deposit")}
        </p>
        <p className="mt-auto border-t border-line pt-3 text-[15px] font-medium text-fg">
          {t("noAgent")}
        </p>
      </div>
    </div>
  );
}
