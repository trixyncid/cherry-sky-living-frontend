"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/shared/BrandMark";
import { Icon } from "@/components/shared/Icon";
import { ProfileAvatarPlaceholder } from "@/components/shared/profile-avatar-placeholder";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { AdminSignOutDialog } from "@/features/admin/components/admin-sign-out-dialog";
import { adminNavGroupsForRole } from "@/features/admin/constants/nav-items";
import {
  activeNavHref,
  navTaskBadge,
  useAdminTasks,
} from "@/features/admin/lib/nav-state";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { UserRole } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "admin.sidebarCollapsed";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    // Ignore private-mode / quota failures.
  }
}

/**
 * Desktop navigation: a black sidebar with grouped pages, burgundy active
 * state and a collapsible icon-only mode (remembered per browser).
 * Phones use AdminMobileNav instead.
 */
export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdminShell();
  const tasks = useAdminTasks();
  const [collapsed, setCollapsed] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => setCollapsed(readCollapsed()), []);

  const current = activeNavHref(pathname);
  const groups = adminNavGroupsForRole(user.role === UserRole.SUPERADMIN);
  const profileActive = pathname.startsWith("/admin/profile");

  function toggleCollapsed() {
    setCollapsed((c) => {
      writeCollapsed(!c);
      return !c;
    });
  }

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
    <aside
      aria-label={t("brand.suite")}
      className={cn(
        "relative hidden h-dvh shrink-0 flex-col bg-ink text-white transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.07]",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-bright"
          aria-label={t("brand.name")}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
            <BrandMark tone="onLight" className="size-6" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold tracking-tight">
                {t("brand.name")}
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-brand-bright">
                {t("brand.suite")}
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 [scrollbar-width:thin]">
        {groups.map((group, gi) => (
          <section key={group.id} className={cn(gi > 0 && "mt-6")}>
            {collapsed ? (
              gi > 0 && (
                <div
                  className="mx-auto mb-3 h-px w-8 bg-white/10"
                  aria-hidden
                />
              )
            ) : (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {t(group.labelKey)}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = current === item.href;
                const badge = navTaskBadge(item.key, tasks);
                const label = t(item.labelKey);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      aria-label={
                        badge > 0
                          ? `${label} — ${t("nav.toProcess", { count: badge })}`
                          : collapsed
                            ? label
                            : undefined
                      }
                      title={collapsed ? label : undefined}
                      className={cn(
                        "group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright",
                        collapsed ? "justify-center" : "px-3",
                        active
                          ? "bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_6px_16px_-6px_rgb(122_22_48/0.7)]"
                          : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      <Icon
                        name={item.icon}
                        size={20}
                        filled={active}
                        className={cn(
                          "shrink-0",
                          active
                            ? "text-white"
                            : "text-white/55 group-hover:text-white",
                        )}
                      />
                      {!collapsed && (
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                      )}
                      {badge > 0 &&
                        (collapsed ? (
                          <span className="absolute right-2.5 top-2 size-2 rounded-full bg-brand-bright ring-2 ring-ink" />
                        ) : (
                          <span
                            className={cn(
                              "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-5 tabular-nums",
                              active
                                ? "bg-white/20 text-white"
                                : "bg-brand text-white",
                            )}
                          >
                            {badge > 99 ? "99+" : badge}
                          </span>
                        ))}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <Link
          href="/admin/profile"
          title={collapsed ? user.name : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-brand-bright",
            profileActive && "bg-white/[0.08]",
            collapsed && "justify-center",
          )}
        >
          <ProfileAvatarPlaceholder
            className="size-9 shrink-0 ring-2 ring-white/15"
            iconSize={20}
            label={user.name}
          />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {user.name}
              </span>
              <span className="block truncate text-xs text-white/45">
                {user.email}
              </span>
            </span>
          )}
        </Link>

        <div
          className={cn(
            "mt-1 flex gap-1",
            collapsed ? "flex-col items-center" : "items-center",
          )}
        >
          <button
            type="button"
            onClick={() => setSignOutOpen(true)}
            title={collapsed ? t("nav.signOut") : undefined}
            aria-label={collapsed ? t("nav.signOut") : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-lg text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-brand-bright",
              collapsed ? "w-9 justify-center" : "flex-1 px-2",
            )}
          >
            <Icon name="logout" size={18} />
            {!collapsed && t("nav.signOut")}
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={
              collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
            }
            title={
              collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
            }
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-brand-bright"
          >
            <Icon
              name={collapsed ? "left_panel_open" : "left_panel_close"}
              size={18}
            />
          </button>
        </div>
      </div>

      <AdminSignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={confirmSignOut}
        pending={signingOut}
      />
    </aside>
  );
}
