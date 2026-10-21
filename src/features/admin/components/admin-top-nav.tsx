"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BrandMark } from "@/components/shared/BrandMark";
import { Icon } from "@/components/shared/Icon";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ProfileAvatarPlaceholder } from "@/components/shared/profile-avatar-placeholder";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AdminNotifications } from "@/features/admin/components/admin-notifications";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { AdminSignOutDialog } from "@/features/admin/components/admin-sign-out-dialog";
import {
  adminCreateActions,
  adminNavGroups,
} from "@/features/admin/constants/nav-items";
import { activeNavHref } from "@/features/admin/lib/nav-state";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { cn } from "@/lib/utils";

const iconBtn =
  "relative flex size-10 shrink-0 items-center justify-center rounded-full text-fg-2 transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const menuItem =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:outline-none";

/**
 * Admin top bar (white): where you are on the left, quick create and
 * account controls on the right. Navigation lives in AdminSidebar (desktop)
 * and AdminMobileNav (phones).
 */
export function AdminTopNav() {
  const t = useTranslations("admin");
  const tm = useTranslations("admin.mobile");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdminShell();
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const current = activeNavHref(pathname);
  const group = adminNavGroups.find((g) =>
    g.items.some((i) => i.href === current),
  );
  const page = group?.items.find((i) => i.href === current);
  const onProfile = pathname.startsWith("/admin/profile");

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await signOutClient();
      setSignOutOpen(false);
      router.push("/admin/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="shrink-0 border-b border-line bg-panel/95 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Phones: brand (the sidebar carries it on desktop). */}
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-2.5 lg:hidden"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink">
            <BrandMark tone="onDark" className="size-6" />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight text-fg">
            {t("brand.name")}
          </span>
        </Link>

        {/* Desktop: breadcrumb for orientation. */}
        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 items-center gap-2 text-sm lg:flex"
        >
          {onProfile ? (
            <span className="font-medium text-fg">
              {t("pages.profile.title")}
            </span>
          ) : (
            <>
              {group && group.items.length > 1 && (
                <>
                  <span className="text-fg-muted">{t(group.labelKey)}</span>
                  <Icon
                    name="chevron_right"
                    size={16}
                    className="text-fg-faint"
                  />
                </>
              )}
              {page && (
                <span className="truncate font-medium text-fg">
                  {t(page.labelKey)}
                </span>
              )}
            </>
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Popover open={createOpen} onOpenChange={setCreateOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="admin-btn-primary mr-1 hidden h-10 items-center gap-1.5 rounded-full pl-3.5 pr-4 text-sm font-medium transition-colors lg:inline-flex"
              >
                <Icon name="add" size={18} />
                {tm("create")}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="glass-overlay w-64 rounded-xl p-1.5"
            >
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                {tm("createTitle")}
              </p>
              {adminCreateActions.map((a) => (
                <Link
                  key={a.key}
                  href={a.href}
                  onClick={() => setCreateOpen(false)}
                  className={menuItem}
                >
                  <span className="flex size-7 items-center justify-center rounded-md bg-brand-soft text-brand">
                    <Icon name={a.icon} size={16} />
                  </span>
                  {tm(`actions.${a.key}`)}
                </Link>
              ))}
            </PopoverContent>
          </Popover>

          <div className="hidden sm:block">
            <LanguageSwitcher variant="navbar" isSolid />
          </div>

          <AdminNotifications className={iconBtn} />

          <Popover open={profileOpen} onOpenChange={setProfileOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={user.name}
                className="ml-1 rounded-full transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <ProfileAvatarPlaceholder
                  className="size-9 rounded-full ring-2 ring-line"
                  iconSize={20}
                  label={user.name}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="glass-overlay w-64 rounded-xl p-1.5"
            >
              <div className="border-b border-line px-3 pb-3 pt-2">
                <p className="truncate text-sm font-semibold text-fg">
                  {user.name}
                </p>
                <p className="truncate text-xs text-fg-muted">{user.email}</p>
              </div>
              <div className="pt-1.5">
                <Link
                  href="/admin/profile"
                  onClick={() => setProfileOpen(false)}
                  className={menuItem}
                >
                  <Icon name="person" size={18} className="text-fg-muted" />
                  {t("pages.profile.title")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setSignOutOpen(true);
                  }}
                  className={cn(menuItem, "text-danger hover:bg-danger-soft")}
                >
                  <Icon name="logout" size={18} />
                  {t("nav.signOut")}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <AdminSignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={confirmSignOut}
        pending={signingOut}
      />
    </header>
  );
}
