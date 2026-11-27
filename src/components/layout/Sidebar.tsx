/**
 * Sidebar Component
 * Mobile menu sheet: navy, large numbered links (active one underlined),
 * outlined CTA — the navbar's language at full height.
 */

"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CHECK_AVAILABILITY_HREF,
  PUBLIC_NAV_LINKS,
} from "@/components/layout/nav-links";
import { BrandMark } from "@/components/shared/BrandMark";
import { Icon } from "@/components/shared/Icon";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizePath(pathname: string) {
  return pathname.replace(/^\/(en|id)(?=\/|$)/, "") || "/";
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const t = useTranslations();
  const current = normalizePath(usePathname() ?? "");

  const handleClose = () => onOpenChange(false);
  const links = [
    { href: "/", label: t("nav.home") },
    ...PUBLIC_NAV_LINKS.map((link) => ({
      href: link.href,
      label: t(`nav.${link.key}`),
    })),
    { href: "/about", label: t("nav.about") },
  ];
  const isActive = (href: string) =>
    href === "/"
      ? current === "/"
      : current === href ||
        current.startsWith(`${href}/`) ||
        // Room detail pages belong to "Rooms".
        (href === "/search-kosts" && current.startsWith("/kosts"));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="site w-full gap-0 border-white/10 bg-ink! p-0 text-white shadow-none! sm:max-w-md [&>button:last-child]:top-6 [&>button:last-child]:right-5 [&>button:last-child]:size-10 [&>button:last-child]:border [&>button:last-child]:border-white/40 [&>button:last-child]:p-0 [&>button:last-child]:text-white [&>button:last-child]:opacity-100 [&>button:last-child]:hover:bg-white [&>button:last-child]:hover:text-ink [&>button:last-child]:inline-flex [&>button:last-child]:items-center [&>button:last-child]:justify-center"
      >
        <SheetHeader className="h-[5.5rem] justify-center border-b border-white/10 px-5 py-0 sm:px-8">
          <SheetTitle className="flex items-center text-left">
            <BrandMark variant="nav" tone="onDark" className="h-8 w-[9.5rem]" />
            <span className="sr-only">{t("common.brand.fullName")}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-10 pt-8 sm:px-8">
          <p className="eyebrow flex items-center gap-4 text-white/75">
            <span aria-hidden className="h-px w-10 bg-white/50" />
            {t("nav.explore")}
          </p>
          <nav className="mt-6">
            <ul className="flex flex-col">
              {links.map((link, i) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={handleClose}
                      aria-current={active ? "page" : undefined}
                      className="group flex items-baseline gap-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span className="w-6 text-xs tabular-nums text-white/40">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "text-[2rem] font-semibold leading-tight tracking-[-0.035em] underline-offset-8 transition-colors",
                          active
                            ? "text-white underline decoration-1"
                            : "text-white/60 group-hover:text-white",
                        )}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Link
            href={CHECK_AVAILABILITY_HREF}
            onClick={handleClose}
            className="btn btn-outline-light group mt-10 w-full justify-between"
          >
            {t("nav.checkAvailability")}
            <Icon
              name="north_east"
              size={17}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>

          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/15 pt-8">
            <div>
              <p className="eyebrow text-[10px] text-white/60">
                {t("common.accountSection")}
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-[15px]">
                <li>
                  <Link
                    href="/tenant/login"
                    onClick={handleClose}
                    className="text-white/75 hover:text-white"
                  >
                    {t("nav.account")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tenant/login"
                    onClick={handleClose}
                    className="text-white/75 hover:text-white"
                  >
                    {t("nav.login")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-[10px] text-white/60">
                {t("common.language")}
              </p>
              <div className="mt-3">
                <LanguageSwitcher variant="sidebar" />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
