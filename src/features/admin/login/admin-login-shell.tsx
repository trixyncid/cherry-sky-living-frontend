"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/shared/BrandMark";
import { Icon } from "@/components/shared/Icon";
import { LOGIN_BACKGROUND_IMAGE } from "@/features/admin/login/constants";
import { Link } from "@/i18n/routing";

export type LoginPortal = "admin" | "tenant";

type AdminLoginShellProps = {
  children: React.ReactNode;
  portal: LoginPortal;
};

/**
 * Shared admin/tenant login: large rounded photo panel with brand and
 * headline (desktop), white form card on a light grey canvas.
 */
export function AdminLoginShell({ children, portal }: AdminLoginShellProps) {
  const tCommon = useTranslations("common.brand");
  const tShell = useTranslations("common.loginShell");
  const tAdminBrand = useTranslations("admin.brand");
  const tTenant = useTranslations("tenant");
  const tLogin = useTranslations(
    portal === "admin" ? "admin.login" : "tenant.login",
  );

  const brandName = portal === "admin" ? tAdminBrand("name") : tCommon("name");
  const eyebrow =
    portal === "admin" ? tAdminBrand("suite") : tTenant("portalName");
  const headline =
    portal === "admin" ? tShell("adminHeadline") : tShell("tenantHeadline");

  return (
    <div className="grid min-h-dvh bg-[#efe8e7] p-3 text-[#141414] sm:p-4 lg:grid-cols-[1.1fr_1fr] lg:gap-4">
      {/* Photo panel */}
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-[#2a2420] lg:block">
        <Image
          src={LOGIN_BACKGROUND_IMAGE}
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
        <div className="absolute left-6 top-6 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-white">
            <BrandMark tone="onLight" className="size-8" />
          </span>
          <span className="text-xl font-medium tracking-tight text-white">
            {brandName}
          </span>
        </div>
        <div className="absolute inset-x-8 bottom-8 max-w-xl text-white">
          <span className="inline-flex rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur-md">
            {eyebrow}
          </span>
          <p className="mt-4 text-[clamp(2rem,3.2vw,3rem)] font-medium leading-[1.05] tracking-[-0.035em]">
            {headline}
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="flex flex-col">
        <div className="flex items-center justify-between px-2 py-2 sm:px-4">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/70 px-4 text-sm font-medium text-[#141414] transition-colors hover:bg-white"
          >
            <Icon name="arrow_back" size={18} />
            {tShell("backToWebsite")}
          </Link>
          <span className="flex size-11 items-center justify-center rounded-full bg-white lg:hidden">
            <BrandMark tone="onLight" className="size-7" />
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-2 py-10 sm:px-6">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-7 sm:p-10">
            <div className="mb-8">
              <span className="inline-flex rounded-full bg-[#f6f0ef] px-3.5 py-1.5 text-[13px] font-medium text-[#3d3a36]">
                {eyebrow}
              </span>
              <h1 className="mt-4 text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.03em]">
                {brandName}
              </h1>
              <p className="mt-2 text-base leading-relaxed text-[#6b6b6b]">
                {tLogin("subtitle")}
              </p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
