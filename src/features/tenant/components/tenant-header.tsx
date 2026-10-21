"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ProfileAvatarPlaceholder } from "@/components/shared/profile-avatar-placeholder";
import { useTenantShell } from "@/features/tenant/components/tenant-shell-context";
import { tenantNavItems } from "@/features/tenant/constants/nav-items";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function TenantHeader() {
  const t = useTranslations("tenant");
  const th = useTranslations("tenant.header");
  const pathname = usePathname();
  const { user, toggleMobile } = useTenantShell();

  const activeItem =
    tenantNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? tenantNavItems[0];

  const pageTitle = pathname.startsWith("/tenant/profile")
    ? t("pages.profile.title")
    : t(activeItem.labelKey);

  return (
    <div className="shrink-0 px-4 pt-3 sm:px-6 lg:px-8">
      <header className="glass-panel-strong rounded-2xl">
        <div className="flex h-16 items-center gap-4 px-3 sm:px-5">
          <button
            type="button"
            onClick={toggleMobile}
            className="glass-control flex size-10 shrink-0 items-center justify-center rounded-xl text-[#51443c] transition-colors hover:bg-white/80 lg:hidden"
            aria-label={th("openMenu")}
          >
            <Icon name="menu" size={22} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tracking-wide text-[#83746b]">
              {th("breadcrumb")}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-[#1a1c1a]">
              {pageTitle}
            </h1>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageSwitcher variant="navbar" isSolid />

            <div className="hidden h-8 w-px bg-white/50 sm:block" />

            <Link
              href="/tenant/profile"
              className={cn(
                "flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/45",
              )}
            >
              <ProfileAvatarPlaceholder
                className="size-9 ring-2 ring-white/80"
                iconSize={20}
                label={user.name}
              />
              <span className="hidden text-left md:block">
                <span className="block max-w-[120px] truncate text-sm font-semibold text-[#1a1c1a]">
                  {user.name}
                </span>
                <span className="block text-xs text-[#83746b]">
                  {th("roleTenant")}
                </span>
              </span>
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
