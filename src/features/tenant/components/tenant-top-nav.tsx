"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BrandMark } from "@/components/shared/BrandMark";
import { Icon } from "@/components/shared/Icon";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ProfileAvatarPlaceholder } from "@/components/shared/profile-avatar-placeholder";
import { SignOutDialog } from "@/components/shared/sign-out-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTenantShell } from "@/features/tenant/components/tenant-shell-context";
import { tenantNavItems } from "@/features/tenant/constants/nav-items";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { contactSummary } from "@/lib/phone";
import { cn } from "@/lib/utils";

function activeHref(pathname: string): string {
  const match = tenantNavItems
    .filter((item) =>
      item.href === "/tenant"
        ? pathname === "/tenant"
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? "/tenant";
}

const pill =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg pl-3 pr-3.5 text-sm font-medium transition-colors";

/**
 * Tenant top bar — same language as the admin portal: brand, pill tabs,
 * language + account. On phones the tabs drop into a swipeable row under
 * the bar (no drawer to open).
 */
export function TenantTopNav() {
  const t = useTranslations("tenant");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useTenantShell();
  const current = activeHref(pathname);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await signOutClient();
      setSignOutOpen(false);
      router.push("/tenant/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const tabs = tenantNavItems.map((item) => {
    const active = current === item.href;
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          pill,
          // Same treatment as the admin sidebar items.
          active
            ? "bg-brand text-white"
            : "text-white/65 hover:bg-white/[0.06] hover:text-white",
        )}
      >
        <Icon name={item.icon} size={18} />
        {t(item.labelKey)}
      </Link>
    );
  });

  return (
    <header className="shrink-0 border-b border-white/[0.07] bg-ink text-white">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/tenant"
          className="flex min-w-0 shrink-0 items-center gap-3"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-white">
            <BrandMark tone="onLight" className="size-6" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-[15px] font-semibold tracking-tight">
              {tc("brand.name")}
            </span>
            <span className="block text-xs font-medium uppercase tracking-[0.12em] text-brand-bright">
              {t("portalName")}
            </span>
          </span>
        </Link>

        <nav
          aria-label={t("nav.group")}
          className="mx-auto hidden items-center gap-2 lg:flex"
        >
          {tabs}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <LanguageSwitcher variant="navbar" />
          <Popover open={accountOpen} onOpenChange={setAccountOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={user.name}
                className="flex items-center gap-2.5 rounded-full text-left transition-opacity hover:opacity-90"
              >
                <ProfileAvatarPlaceholder
                  className="size-9 rounded-full ring-2 ring-white/15"
                  iconSize={20}
                  label={user.name}
                />
                <span className="hidden max-w-40 lg:block">
                  <span className="block truncate text-sm font-medium">
                    {user.name}
                  </span>
                  <span className="block text-xs text-white/60">
                    {t("header.roleTenant")}
                  </span>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 rounded-2xl border border-line bg-white p-2"
            >
              <div className="px-3 py-2">
                <p className="truncate text-[15px] font-semibold text-fg">
                  {user.name}
                </p>
                <p className="truncate text-sm text-fg-muted">
                  {contactSummary(user)}
                </p>
              </div>
              <Link
                href="/tenant/profile"
                onClick={() => setAccountOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-fg hover:bg-hover"
              >
                <Icon name="person" size={18} />
                {t("nav.profile")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  setSignOutOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-danger hover:bg-danger-soft"
              >
                <Icon name="logout" size={18} />
                {t("nav.signOut")}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <SignOutDialog
        namespace="tenant.signOutDialog"
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={confirmSignOut}
        pending={signingOut}
      />
    </header>
  );
}
