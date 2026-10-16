"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { MobileTabBar } from "@/components/shared/mobile-tab-bar";
import { tenantNavItems } from "@/features/tenant/constants/nav-items";
import { useTenantLeases } from "@/features/tenant/hooks/use-tenant-queries";
import { getTenantRenewalView } from "@/features/tenant/lib/lease-renewal";
import { usePathname } from "@/i18n/routing";

const SHORT_LABEL: Record<string, string> = {
  home: "home",
  leases: "leases",
  leaseRenewals: "renewals",
  profile: "profile",
};

/** Phone tabs for tenants; Renewals shows a dot when a decision is waiting. */
export function TenantMobileNav() {
  const t = useTranslations("tenant");
  const pathname = usePathname();
  const { data: leases = [] } = useTenantLeases();
  const renewalsWaiting = useMemo(
    () => leases.filter((l) => getTenantRenewalView(l) === "prompt").length,
    [leases],
  );

  return (
    <MobileTabBar
      label={t("nav.group")}
      tabs={tenantNavItems.map((item) => ({
        key: item.key,
        href: item.href,
        icon: item.icon,
        label: t(`mobile.${SHORT_LABEL[item.key] ?? item.key}`),
        active:
          item.href === "/tenant"
            ? pathname === "/tenant"
            : pathname === item.href || pathname.startsWith(`${item.href}/`),
        badge: item.key === "leaseRenewals" ? renewalsWaiting : 0,
      }))}
    />
  );
}
