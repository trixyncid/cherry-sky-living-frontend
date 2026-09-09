"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { ProfileAvatarPlaceholder } from "@/components/shared/profile-avatar-placeholder";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import {
  adminNavGroups,
  adminNavItems,
  type AdminNavGroup,
  type AdminNavPageKey,
} from "@/features/admin/constants/nav-items";
import { UserRole } from "@/lib/types/auth";
import { AdminSignOutDialog } from "@/features/admin/components/admin-sign-out-dialog";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { useLeases } from "@/features/admin/hooks/use-admin-queries";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { cn } from "@/lib/utils";

function navGroupsForRole(role: UserRole): AdminNavGroup[] {
  if (role === UserRole.SUPERADMIN) return adminNavGroups;
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.key !== "staff"),
    }))
    .filter((group) => group.items.length > 0);
}

function resolveActiveNavHref(pathname: string): string | null {
  const matches = adminNavItems.filter((item) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) =>
    item.href.length > best.href.length ? item : best,
  ).href;
}

function NavCountBadge({
  count,
  active,
  label,
}: {
  count: number;
  active: boolean;
  label: string;
}) {
  if (count <= 0) return null;
  const display = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
        active
          ? "bg-white/20 text-white ring-1 ring-white/35"
          : "bg-[linear-gradient(135deg,#a44a32_0%,#6f4627_100%)] text-white shadow-[0_4px_10px_rgb(90_36_48/0.28)]",
      )}
      aria-label={label}
    >
      {display}
    </span>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdminShell();
  const { data: leases = [] } = useLeases();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await signOutClient();
      onNavigate?.();
      setSignOutOpen(false);
      router.push("/admin/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const profileActive = pathname.startsWith("/admin/profile");
  const navGroups = navGroupsForRole(user.role);
  const pendingRenewalReviews = useMemo(
    () =>
      leases.filter((lease) => {
        const renewal = lease.leaseRenewal;
        return (
          Boolean(renewal?.isRenewLease) &&
          !renewal?.isConfirmed &&
          !renewal?.markAsCompleted
        );
      }).length,
    [leases],
  );

  const navBadges: Partial<Record<AdminNavPageKey, number>> = {
    leaseRenewals: pendingRenewalReviews,
  };

  return (
    <>
      <Link
        href="/admin"
        onClick={onNavigate}
        className="mb-6 flex items-center gap-3 rounded-2xl px-1.5 py-1 transition-opacity hover:opacity-90"
      >
        <Image
          src="/logo.svg"
          alt={t("brand.name")}
          width={44}
          height={44}
          className="size-11 shrink-0 object-contain"
          priority
        />
        <div>
          <p className="truncate text-base font-bold tracking-tight text-[#1a1c1a]">
            {t("brand.name")}
          </p>
          <p className="text-[11px] font-medium tracking-wide text-ferrugem">
            {t("brand.suite")}
          </p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        {navGroups.map((group) => (
          <section key={group.id}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#83746b]/80">
              {t(group.labelKey)}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = resolveActiveNavHref(pathname) === item.href;
                const badgeCount = navBadges[item.key] ?? 0;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-[#6f4627]/95 to-ferrugem/90 text-white shadow-[0_8px_18px_rgb(90_36_48/0.26)] ring-1 ring-white/20"
                          : "text-[#51443c] hover:bg-white/45 hover:text-[#1a1c1a]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          active
                            ? "bg-white/15"
                            : "bg-white/50 group-hover:bg-white/80",
                        )}
                      >
                        <Icon
                          name={item.icon}
                          size={18}
                          filled={active}
                          className={active ? "text-white" : "text-ferrugem"}
                        />
                      </span>
                      <span className="min-w-0 truncate">{t(item.labelKey)}</span>
                      {badgeCount > 0 ? (
                        <NavCountBadge
                          count={badgeCount}
                          active={active}
                          label={t("nav.leaseRenewalsPending", {
                            count: badgeCount,
                          })}
                        />
                      ) : (
                        active && (
                          <span className="ml-auto size-1.5 shrink-0 rounded-full bg-ferrugem-soft shadow-[0_0_8px_rgb(240_212_200/0.9)]" />
                        )
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="mt-6 space-y-2 border-t border-white/40 pt-5">
        <Link
          href="/admin/profile"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-2xl p-2.5 transition-all",
            profileActive
              ? "bg-white/55 ring-1 ring-white/70"
              : "bg-white/30 hover:bg-white/50",
          )}
        >
          <ProfileAvatarPlaceholder
            className="size-10 ring-2 ring-white/80"
            iconSize={22}
            label={user.name}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#1a1c1a]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[#83746b]">{user.email}</p>
          </div>
          <Icon name="chevron_right" size={20} className="shrink-0 text-[#83746b]" />
        </Link>

        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#51443c] transition-colors hover:bg-[#ffdad6]/45 hover:text-[#ba1a1a]"
        >
          <Icon name="logout" size={20} />
          {t("nav.signOut")}
        </button>
      </div>

      <AdminSignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={confirmSignOut}
        pending={signingOut}
      />
    </>
  );
}

export function AdminSidebar() {
  const t = useTranslations("admin");
  const { mobileOpen, setMobileOpen } = useAdminShell();

  return (
    <>
      <aside className="glass-panel-strong fixed top-3 bottom-3 left-3 z-50 hidden w-[272px] flex-col rounded-[1.75rem] p-5 lg:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label={t("common.closeMenu")}
          className="fixed inset-0 z-50 bg-[#1a1c1a]/35 backdrop-blur-md lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "glass-panel-strong fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,280px)] flex-col rounded-r-[1.75rem] p-5 shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
