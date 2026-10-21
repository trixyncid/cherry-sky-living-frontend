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
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full pl-3.5 pr-4 text-[15px] font-medium transition-colors";

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
          active
            ? "bg-[#71130d] text-white shadow-[0_12px_28px_-14px_rgb(113_19_13/0.75)]"
            : "border border-[#ece4e2] bg-white text-[#3d3a36] hover:border-[#e8bfb9] hover:text-[#71130d]",
        )}
      >
        <Icon name={item.icon} size={18} />
        {t(item.labelKey)}
      </Link>
    );
  });

  return (
    <header className="shrink-0 border-b border-[#ece4e2] bg-[#f7f3f2]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/tenant"
          className="flex min-w-0 shrink-0 items-center gap-3"
        >
          <span className="flex size-11 items-center justify-center rounded-full border border-[#ece4e2] bg-white">
            <BrandMark tone="onLight" className="size-7" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-lg font-medium tracking-tight text-[#141414]">
              {tc("brand.name")}
            </span>
            <span className="block text-xs text-[#6b6b6b]">
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
          <LanguageSwitcher variant="navbar" isSolid />
          <Popover open={accountOpen} onOpenChange={setAccountOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={user.name}
                className="flex items-center gap-2.5 rounded-full text-left transition-opacity hover:opacity-90"
              >
                <ProfileAvatarPlaceholder
                  className="size-10 rounded-full ring-2 ring-[#e8bfb9]"
                  iconSize={20}
                  label={user.name}
                />
                <span className="hidden max-w-40 lg:block">
                  <span className="block truncate text-[15px] font-medium text-[#141414]">
                    {user.name}
                  </span>
                  <span className="block text-xs text-[#6b6b6b]">
                    {t("header.roleTenant")}
                  </span>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 rounded-2xl border border-[#ece4e2] bg-white p-2"
            >
              <div className="px-3 py-2">
                <p className="truncate text-[15px] font-semibold text-[#141414]">
                  {user.name}
                </p>
                <p className="truncate text-sm text-[#6b6b6b]">
                  {contactSummary(user)}
                </p>
              </div>
              <Link
                href="/tenant/profile"
                onClick={() => setAccountOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-[#141414] hover:bg-[#f6f0ef]"
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
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-[#a1271b] hover:bg-[#fdecea]"
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
