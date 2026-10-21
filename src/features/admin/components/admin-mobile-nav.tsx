"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { MobileTabBar } from "@/components/shared/mobile-tab-bar";
import { ProfileAvatarPlaceholder } from "@/components/shared/profile-avatar-placeholder";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { AdminSignOutDialog } from "@/features/admin/components/admin-sign-out-dialog";
import {
  adminCreateActions,
  adminNavGroupsForRole,
  adminPageIcons,
} from "@/features/admin/constants/nav-items";
import {
  activeNavHref,
  navTaskBadge,
  useAdminTasks,
} from "@/features/admin/lib/nav-state";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { UserRole } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

const sheetClass =
  "max-h-[88dvh] gap-0 overflow-y-auto rounded-t-[1.75rem] border-line bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3";

/**
 * Phone navigation for the admin portal: Home · Leases · (+) · Units · More.
 * "+" opens quick-create; "More" holds every page, language and sign-out.
 */
export function AdminMobileNav() {
  const t = useTranslations("admin");
  const tm = useTranslations("admin.mobile");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdminShell();
  const tasks = useAdminTasks();
  const current = activeNavHref(pathname);
  const [sheet, setSheet] = useState<"create" | "more" | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const groups = adminNavGroupsForRole(user.role === UserRole.SUPERADMIN);

  const onTab = (href: string) => current === href;
  const inMore =
    !!current && !["/admin", "/admin/leases", "/admin/units"].includes(current);

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
    <>
      <MobileTabBar
        label={t("brand.suite")}
        tabs={[
          {
            key: "home",
            label: tm("home"),
            icon: adminPageIcons.overview,
            href: "/admin",
            active: onTab("/admin"),
          },
          {
            key: "leases",
            label: tm("leases"),
            icon: adminPageIcons.leases,
            href: "/admin/leases",
            active: onTab("/admin/leases"),
            badge: tasks.payments.length,
          },
          {
            key: "create",
            label: tm("create"),
            icon: "add",
            primary: true,
            onClick: () => setSheet("create"),
          },
          {
            key: "units",
            label: tm("units"),
            icon: adminPageIcons.units,
            href: "/admin/units",
            active: onTab("/admin/units"),
          },
          {
            key: "more",
            label: tm("more"),
            icon: "menu",
            active: inMore || sheet === "more",
            badge: navTaskBadge("leaseRenewals", tasks),
            onClick: () => setSheet("more"),
          },
        ]}
      />

      {/* Quick create */}
      <Sheet
        open={sheet === "create"}
        onOpenChange={(o) => setSheet(o ? "create" : null)}
      >
        <SheetContent side="bottom" className={sheetClass}>
          <span
            className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line"
            aria-hidden
          />
          <SheetTitle className="text-xl font-medium tracking-tight text-fg">
            {tm("createTitle")}
          </SheetTitle>
          <SheetDescription className="mb-4 text-sm text-fg-muted">
            {tm("createHint")}
          </SheetDescription>
          <div className="grid grid-cols-2 gap-2.5">
            {adminCreateActions.map((a, i) => (
              <Link
                key={a.key}
                href={a.href}
                onClick={() => setSheet(null)}
                className={cn(
                  "flex min-h-20 flex-col justify-between gap-2 rounded-2xl p-3.5 text-[15px] font-medium transition-colors",
                  i === 0
                    ? "bg-brand text-white"
                    : "border border-line bg-white text-fg active:bg-hover",
                )}
              >
                <Icon
                  name={a.icon}
                  size={22}
                  className={i === 0 ? "text-white" : "text-brand"}
                />
                {tm(`actions.${a.key}`)}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Full menu */}
      <Sheet
        open={sheet === "more"}
        onOpenChange={(o) => setSheet(o ? "more" : null)}
      >
        <SheetContent side="bottom" className={sheetClass}>
          <span
            className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line"
            aria-hidden
          />
          <SheetTitle className="sr-only">{tm("menuTitle")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("brand.suite")}
          </SheetDescription>

          <Link
            href="/admin/profile"
            onClick={() => setSheet(null)}
            className="mb-4 flex items-center gap-3 rounded-2xl bg-subtle p-3"
          >
            <ProfileAvatarPlaceholder
              className="size-12 rounded-full ring-2 ring-brand-line"
              iconSize={22}
              label={user.name}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium text-fg">
                {user.name}
              </span>
              <span className="block truncate text-sm text-fg-muted">
                {user.email}
              </span>
            </span>
            <Icon name="chevron_right" size={20} className="text-fg-muted" />
          </Link>

          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.id}>
                <p className="mb-2 px-1 text-sm font-medium text-fg-muted">
                  {t(group.labelKey)}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((item) => {
                    const active = current === item.href;
                    const badge = navTaskBadge(item.key, tasks);
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setSheet(null)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex min-h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 text-center text-[13px] font-medium leading-tight transition-colors",
                          active
                            ? "bg-brand text-white"
                            : "border border-line bg-white text-fg active:bg-hover",
                        )}
                      >
                        <Icon
                          name={item.icon}
                          size={22}
                          className={active ? "text-white" : "text-brand"}
                        />
                        {t(item.labelKey)}
                        {badge > 0 ? (
                          <span className="absolute right-2 top-2 flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold leading-5 text-white ring-2 ring-white">
                            {badge > 9 ? "9+" : badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <LanguageSwitcher variant="navbar" isSolid />
            <button
              type="button"
              onClick={() => {
                setSheet(null);
                setSignOutOpen(true);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-danger active:bg-danger-soft"
            >
              <Icon name="logout" size={18} />
              {t("nav.signOut")}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AdminSignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={confirmSignOut}
        pending={signingOut}
      />
    </>
  );
}
