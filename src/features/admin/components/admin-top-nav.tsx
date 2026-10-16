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
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { AdminSignOutDialog } from "@/features/admin/components/admin-sign-out-dialog";
import {
  type AdminNavGroup,
  type AdminNavItem,
  adminNavGroups,
} from "@/features/admin/constants/nav-items";
import {
  activeNavHref,
  usePendingRenewals,
} from "@/features/admin/lib/nav-state";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { UserRole } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

function groupsForRole(role: UserRole): AdminNavGroup[] {
  if (role === UserRole.SUPERADMIN) return adminNavGroups;
  return adminNavGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.key !== "staff") }))
    .filter((g) => g.items.length > 0);
}

const pill =
  "inline-flex h-11 items-center gap-2 rounded-full pl-4 pr-5 text-[15px] font-medium transition-colors";
const pillIdle =
  "border border-[#ece4e2] bg-white text-[#3d3a36] hover:border-[#e8bfb9] hover:text-[#71130d]";
const pillActive =
  "bg-[#71130d] text-white shadow-[0_12px_28px_-14px_rgb(113_19_13/0.75)]";
const roundBtn =
  "relative flex size-11 shrink-0 items-center justify-center rounded-full border border-[#ece4e2] bg-white text-[#3d3a36] transition-colors hover:border-[#e8bfb9] hover:text-[#71130d]";

/**
 * Admin top bar (light) — brand, grouped icon-pill navigation (single-item groups are
 * plain pills, multi-item groups open a menu), and round utility buttons.
 * Mobile keeps the slide-in drawer (AdminSidebar).
 */
export function AdminTopNav() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdminShell();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const current = activeNavHref(pathname);
  const groups = groupsForRole(user.role);
  const pendingRenewals = usePendingRenewals();

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

  const renderItemLink = (item: AdminNavItem, inMenu = false) => {
    const active = current === item.href;
    const badge = item.key === "leaseRenewals" ? pendingRenewals : 0;
    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={() => setOpenGroup(null)}
        aria-current={active ? "page" : undefined}
        className={
          inMenu
            ? cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
                active
                  ? "bg-[#71130d] text-white"
                  : "text-[#141414] hover:bg-[#f6f0ef]",
              )
            : cn(pill, active ? pillActive : pillIdle)
        }
      >
        <Icon name={item.icon} size={18} />
        <span className="flex-1">{t(item.labelKey)}</span>
        {badge > 0 ? (
          <span className="rounded-full bg-[#e8bfb9] px-2 py-0.5 text-xs font-semibold text-[#5c0f0a]">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <header className="shrink-0 border-b border-[#ece4e2] bg-[#f7f3f2]/90 px-4 py-2 text-[#141414] backdrop-blur-md sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3">
        <Link
          href="/admin"
          className="flex min-w-0 shrink-0 items-center gap-3"
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-[#ece4e2] bg-white">
            <BrandMark tone="onLight" className="size-8" />
          </span>
          <span className="hidden min-w-0 sm:block lg:hidden xl:block">
            <span className="block truncate text-xl font-medium tracking-tight text-[#141414]">
              {t("brand.name")}
            </span>
            <span className="block text-xs text-[#6b6b6b]">
              {t("brand.suite")}
            </span>
          </span>
        </Link>

        <nav
          aria-label={t("brand.suite")}
          className="mx-auto hidden items-center gap-1.5 lg:flex xl:gap-2"
        >
          {groups.map((group) =>
            group.items.length === 1 && group.items[0] ? (
              renderItemLink(group.items[0])
            ) : (
              <Popover
                key={group.id}
                open={openGroup === group.id}
                onOpenChange={(o) => setOpenGroup(o ? group.id : null)}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      pill,
                      group.items.some((i) => i.href === current)
                        ? pillActive
                        : pillIdle,
                    )}
                  >
                    <Icon name={group.items[0]?.icon ?? "apps"} size={18} />
                    {t(group.labelKey)}
                    {group.items.some((i) => i.key === "leaseRenewals") &&
                    pendingRenewals > 0 ? (
                      <span className="size-2 rounded-full bg-[#34a853]" />
                    ) : null}
                    <Icon name="expand_more" size={18} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  className="glass-overlay w-64 rounded-2xl p-2"
                >
                  {group.items.map((item) => renderItemLink(item, true))}
                </PopoverContent>
              </Popover>
            ),
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher variant="navbar" isSolid />
          </div>
          <Link
            href="/admin/lease-renewals"
            className={roundBtn}
            aria-label={t("nav.leaseRenewalsPending", {
              count: pendingRenewals,
            })}
          >
            <Icon name="notifications" size={20} />
            {pendingRenewals > 0 ? (
              <span className="absolute right-2 top-2 size-2.5 rounded-full bg-[#34d399] ring-2 ring-white" />
            ) : null}
          </Link>
          <Link
            href="/admin/profile"
            className={cn(roundBtn, "hidden sm:flex")}
            aria-label={t("pages.profile.title")}
          >
            <Icon name="settings" size={20} />
          </Link>
          <Popover open={profileOpen} onOpenChange={setProfileOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={user.name}
                className="flex items-center gap-3 rounded-full text-left transition-opacity hover:opacity-90"
              >
                <ProfileAvatarPlaceholder
                  className="size-11 rounded-full ring-2 ring-[#e8bfb9]"
                  iconSize={22}
                  label={user.name}
                />
                <span className="hidden max-w-44 xl:block">
                  <span className="block truncate text-[15px] font-medium text-[#141414]">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-[#6b6b6b]">
                    {user.email}
                  </span>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="glass-overlay w-64 rounded-2xl p-2"
            >
              <div className="px-3 py-2">
                <p className="truncate text-[15px] font-semibold text-[#141414]">
                  {user.name}
                </p>
                <p className="truncate text-sm text-[#6b6b6b]">{user.email}</p>
              </div>
              <Link
                href="/admin/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-[#141414] hover:bg-[#f6f0ef]"
              >
                <Icon name="person" size={18} />
                {t("pages.profile.title")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setSignOutOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-[#ba1a1a] hover:bg-[#fdecea]"
              >
                <Icon name="logout" size={18} />
                {t("nav.signOut")}
              </button>
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
