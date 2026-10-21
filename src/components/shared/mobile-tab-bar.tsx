"use client";

import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface MobileTab {
  key: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  /** Small count bubble (e.g. pending renewals). */
  badge?: number;
  /** Raised round primary action (e.g. "Create"). */
  primary?: boolean;
}

/**
 * Floating bottom tab bar for the logged-in portals on phones — thumb-reach
 * navigation like a native app. Hidden from `lg` up (desktop has top nav).
 * Respects the iOS home-indicator safe area.
 */
export function MobileTabBar({
  tabs,
  label,
}: {
  tabs: MobileTab[];
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-1 rounded-[1.75rem] border border-line bg-white/95 p-1.5 shadow-[0_18px_40px_-16px_rgb(11_11_13/0.35)] backdrop-blur-md">
        {tabs.map((tab) => {
          const content = tab.primary ? (
            <span className="flex size-12 items-center justify-center rounded-full bg-brand text-white shadow-[0_10px_22px_-8px_rgb(122_22_48/0.8)] transition-transform active:scale-95">
              <Icon name={tab.icon} size={26} />
            </span>
          ) : (
            <span
              className={cn(
                "relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-medium transition-colors",
                tab.active
                  ? "bg-brand-soft text-brand"
                  : "text-fg-muted active:bg-hover",
              )}
            >
              <Icon name={tab.icon} size={22} filled={tab.active} />
              <span className="max-w-full truncate leading-none">
                {tab.label}
              </span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute right-[18%] top-1 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-white">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              ) : null}
            </span>
          );
          const cls = cn(
            "block",
            tab.primary ? "shrink-0 px-1" : "min-w-0 flex-1",
          );
          return (
            <li key={tab.key} className={cls}>
              {tab.href ? (
                <Link
                  href={tab.href}
                  aria-current={tab.active ? "page" : undefined}
                  aria-label={tab.primary ? tab.label : undefined}
                  className="block focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/25 rounded-2xl"
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={tab.onClick}
                  aria-label={tab.primary ? tab.label : undefined}
                  aria-haspopup="dialog"
                  className="block w-full rounded-2xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/25"
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Spacer so page content can scroll clear of the floating tab bar. */
export const mobileTabBarPadding = "pb-32 lg:pb-12";
