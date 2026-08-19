"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { SignOutDialog } from "@/components/shared/sign-out-dialog";
import { ProfileAvatarPlaceholder } from "@/components/shared/profile-avatar-placeholder";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { tenantNavItems } from "@/features/tenant/constants/nav-items";
import { useTenantShell } from "@/features/tenant/components/tenant-shell-context";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

function resolveActiveNavHref(pathname: string): string | null {
  const matches = tenantNavItems.filter(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) =>
    item.href.length > best.href.length ? item : best,
  ).href;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("tenant");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useTenantShell();
  const activeHref = resolveActiveNavHref(pathname);
  const profileActive = pathname.startsWith("/tenant/profile");
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      onNavigate?.();
      setSignOutOpen(false);
      router.push("/tenant/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <Link
        href="/tenant/leases"
        onClick={onNavigate}
        className="mb-6 flex items-center gap-3 rounded-2xl px-1.5 py-1 transition-opacity hover:opacity-90"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5e3c] to-[#6f4627] shadow-[0_8px_20px_rgb(111_70_39/0.28)] ring-1 ring-white/30">
          <Icon name="apartment" size={24} filled className="text-white" />
        </div>
        <div>
          <p className="truncate text-base font-bold tracking-tight text-[#1a1c1a]">
            {tc("brand.name")}
          </p>
          <p className="text-[11px] font-medium tracking-wide text-[#8b5e3c]">
            {t("portalName")}
          </p>
        </div>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#83746b]/80">
          {t("nav.group")}
        </p>
        <ul className="space-y-1">
          {tenantNavItems.map((item) => {
            const active = activeHref === item.href;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-[#6f4627]/92 to-[#8b5e3c]/90 text-white shadow-[0_8px_18px_rgb(111_70_39/0.22)] ring-1 ring-white/20"
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
                      className={active ? "text-white" : "text-[#6f4627]"}
                    />
                  </span>
                  <span className="truncate">{t(item.labelKey)}</span>
                  {active && (
                    <span className="ml-auto size-1.5 shrink-0 rounded-full bg-white/90 shadow-[0_0_8px_white]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 space-y-2 border-t border-white/40 pt-5">
        <Link
          href="/tenant/profile"
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

      <SignOutDialog
        namespace="tenant.signOutDialog"
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={confirmSignOut}
        pending={signingOut}
      />
    </>
  );
}

export function TenantSidebar() {
  const tc = useTranslations("common");
  const { mobileOpen, setMobileOpen } = useTenantShell();

  return (
    <>
      <aside className="glass-panel-strong fixed top-3 bottom-3 left-3 z-50 hidden w-[272px] flex-col rounded-[1.75rem] p-5 lg:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label={tc("closeMenu")}
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
