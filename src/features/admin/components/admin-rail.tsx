"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import {
  type AdminNavPageKey,
  adminNavItems,
} from "@/features/admin/constants/nav-items";
import {
  activeNavHref,
  usePendingRenewals,
} from "@/features/admin/lib/nav-state";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Day-to-day work pages, one click away from anywhere in the portal. */
const RAIL_KEYS: AdminNavPageKey[] = [
  "leases",
  "leaseRenewals",
  "units",
  "users",
  "bookkeeping",
];

/**
 * Floating icon rail (desktop) — round white buttons centred on the left
 * edge, cherry when active, with a label that slides out on hover/focus.
 */
export function AdminRail() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const pendingRenewals = usePendingRenewals();
  const current = activeNavHref(pathname);
  const items = RAIL_KEYS.flatMap(
    (key) => adminNavItems.find((i) => i.key === key) ?? [],
  );

  return (
    <nav
      aria-label={t("nav.shortcuts")}
      className="fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex xl:left-8"
    >
      {items.map((item) => {
        const active = current === item.href;
        const badge = item.key === "leaseRenewals" ? pendingRenewals : 0;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={
              badge > 0
                ? `${t(item.labelKey)} — ${t("nav.leaseRenewalsPending", { count: badge })}`
                : t(item.labelKey)
            }
            className={cn(
              "group relative flex size-12 items-center justify-center rounded-full transition-colors",
              active
                ? "bg-[#71130d] text-white shadow-[0_12px_28px_-12px_rgb(113_19_13/0.8)]"
                : "border border-[#ece4e2] bg-white text-[#3d3a36] shadow-[0_8px_20px_-14px_rgb(28_11_10/0.35)] hover:border-[#e8bfb9] hover:text-[#71130d]",
            )}
          >
            <Icon name={item.icon} size={20} />
            {badge > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-[#71130d] px-1 text-[11px] font-semibold leading-5 text-white ring-2 ring-[#f7f3f2]">
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
            <span
              aria-hidden
              className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full bg-[#1c0b0a] px-3 py-1.5 text-sm text-white opacity-0 transition-[opacity,transform] duration-150 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            >
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
