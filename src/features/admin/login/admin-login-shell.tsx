"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { LOGIN_BACKGROUND_IMAGE } from "@/features/admin/login/constants";

export type LoginPortal = "admin" | "tenant";

type AdminLoginShellProps = {
  children: React.ReactNode;
  portal: LoginPortal;
};

export function AdminLoginShell({ children, portal }: AdminLoginShellProps) {
  const tCommon = useTranslations("common.brand");
  const tAdminBrand = useTranslations("admin.brand");
  const tTenant = useTranslations("tenant");
  const tLogin = useTranslations(
    portal === "admin" ? "admin.login" : "tenant.login",
  );

  const brandName =
    portal === "admin" ? tAdminBrand("name") : tCommon("name");
  const eyebrow =
    portal === "admin" ? tAdminBrand("suite") : tTenant("portalName");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-6">
      <div className="absolute inset-0 z-0 hero-atmosphere" aria-hidden>
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={LOGIN_BACKGROUND_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
        <div className="absolute inset-0 hero-overlay-x" />
        <div className="absolute inset-0 hero-overlay-y" />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-ferrugem/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-1/5 size-80 rounded-full bg-maroon/30 blur-3xl"
          aria-hidden
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="glass-panel-strong relative overflow-hidden rounded-[1.75rem] p-8 sm:p-10">
          <div
            className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-ferrugem/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-16 size-52 rounded-full bg-maroon/10 blur-3xl"
            aria-hidden
          />

          <motion.div
            className="relative mb-8 flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
          >
            <motion.div
              className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5e3c] via-[#6f4627] to-maroon shadow-[0_10px_28px_rgb(90_36_48/0.28)] ring-1 ring-white/40"
              whileHover={{ scale: 1.04, rotate: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              <Icon name="apartment" size={28} className="text-white" />
            </motion.div>

            <p className="text-[1.65rem] font-bold tracking-tight text-[#1a1c1a] sm:text-3xl">
              {brandName}
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ferrugem">
              {eyebrow}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#51443c]">
              {tLogin("subtitle")}
            </p>
          </motion.div>

          <div className="relative">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
