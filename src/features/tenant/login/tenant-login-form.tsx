"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/shared/Icon";
import { RequiredMark } from "@/components/shared/required-mark";
import { useRouter } from "@/i18n/routing";
import { AdminLoginShell } from "@/features/admin/login/admin-login-shell";
import {
  resolveTenantLoginIdentifier,
  tenantLoginSchema,
  type TenantLoginValues,
} from "@/features/tenant/login/schemas";
import { getTenantProfile } from "@/lib/api/tenant/profile";
import { authClient } from "@/lib/auth/client";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { loginErrorKeyFromAuthError, type LoginErrorKey } from "@/lib/auth/errors";
import { getHomePathForRole } from "@/lib/auth/redirects";
import {
  assertCanAccessTenantPortal,
  roleFromSessionUser,
} from "@/lib/auth/role";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const fieldMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.28 + i * 0.06,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const inputClassName = cn(
  "glass-control block h-12 w-full rounded-xl pl-10 pr-3 text-base text-[#141414]",
  "transition-all placeholder:text-[#6b6b6b]",
  "focus:outline-none",
);

function showLoginError(
  t: ReturnType<typeof useTranslations<"tenant.login">>,
  key: LoginErrorKey,
) {
  toast.error(t(`errors.${key}.title`), {
    description: t(`errors.${key}.description`),
  });
}

export function TenantLoginForm() {
  const t = useTranslations("tenant.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const forbiddenFromUrl = searchParams.get("error") === "forbidden";
  const deactivatedFromUrl = searchParams.get("error") === "deactivated";
  const sessionFromUrl = searchParams.get("error") === "session";
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (forbiddenFromUrl) {
      showLoginError(t, "forbidden");
    }
  }, [forbiddenFromUrl, t]);

  useEffect(() => {
    if (deactivatedFromUrl) {
      showLoginError(t, "deactivated");
    }
  }, [deactivatedFromUrl, t]);

  useEffect(() => {
    if (sessionFromUrl) {
      showLoginError(t, "session");
    }
  }, [sessionFromUrl, t]);

  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    } satisfies TenantLoginValues,
    onSubmit: async ({ value }) => {
      const parsed = tenantLoginSchema.safeParse(value);
      if (!parsed.success) {
        showLoginError(t, "invalid");
        return;
      }

      const resolved = resolveTenantLoginIdentifier(parsed.data.identifier);
      if (!resolved) {
        showLoginError(t, "invalid");
        return;
      }

      const result =
        resolved.kind === "email"
          ? await authClient.signIn.email({
              email: resolved.email,
              password: parsed.data.password,
            })
          : await authClient.signIn.phoneNumber({
              phoneNumber: resolved.phoneNumber,
              password: parsed.data.password,
            });

      if (result.error) {
        showLoginError(t, loginErrorKeyFromAuthError(result.error));
        return;
      }

      let role = roleFromSessionUser(
        (result.data as { user?: Record<string, unknown> } | undefined)?.user,
      );

      if (!role) {
        const session = await authClient.getSession();
        role = roleFromSessionUser(
          session.data?.user as Record<string, unknown> | undefined,
        );
      }

      if (!role) {
        try {
          const profile = await getTenantProfile();
          role = profile.role;
        } catch {
          // fall through to access check
        }
      }

      const access = assertCanAccessTenantPortal(role);

      if (!access.ok || !role) {
        await signOutClient();
        showLoginError(t, access.isStaff ? "forbidden" : "invalid");
        return;
      }

      toast.success(t("success"));
      router.refresh();
      router.push(getHomePathForRole(role));
    },
  });

  return (
    <AdminLoginShell portal="tenant">
      <motion.h1
        className="text-lg font-semibold tracking-tight text-[#141414]"
        variants={fieldMotion}
        custom={0}
        initial="hidden"
        animate="visible"
      >
        {t("title")}
      </motion.h1>

      <form
        className="mt-5 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="identifier">
          {(field) => (
            <motion.div
              variants={fieldMotion}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              <label
                htmlFor="tenant-identifier"
                className="mb-2 block text-sm font-semibold tracking-wide text-[#141414]"
                aria-required
              >
                {t("identifierLabel")}
                <RequiredMark className="ml-0.5" />
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon name="person" size={20} className="text-[#6b6b6b]" />
                </div>
                <input
                  id="tenant-identifier"
                  type="text"
                  autoComplete="username"
                  inputMode="email"
                  placeholder={t("identifierPlaceholder")}
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={inputClassName}
                />
              </div>
            </motion.div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <motion.div
              variants={fieldMotion}
              custom={2}
              initial="hidden"
              animate="visible"
            >
              <label
                htmlFor="tenant-password"
                className="mb-2 block text-sm font-semibold tracking-wide text-[#141414]"
                aria-required
              >
                {t("passwordLabel")}
                <RequiredMark className="ml-0.5" />
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon name="lock" size={20} className="text-[#6b6b6b]" />
                </div>
                <input
                  id="tenant-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={cn(inputClassName, "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6b6b6b] transition-colors hover:text-[#141414]"
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                >
                  <Icon
                    name={showPassword ? "visibility_off" : "visibility"}
                    size={20}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <motion.div
              variants={fieldMotion}
              custom={3}
              initial="hidden"
              animate="visible"
            >
              <motion.button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={cn(
                  "admin-btn-primary mt-1 flex h-12 w-full items-center justify-center rounded-full border border-transparent",
                  "px-4 text-[15px] font-semibold",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 focus:ring-offset-white",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
                whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              >
                {isSubmitting ? t("submitting") : t("submit")}
              </motion.button>
            </motion.div>
          )}
        </form.Subscribe>
      </form>

      <motion.div
        className="mt-8 border-t border-[#f0efed] pt-5 text-center"
        variants={fieldMotion}
        custom={4}
        initial="hidden"
        animate="visible"
      >
        <p className="text-xs font-medium text-[#6b6b6b]">{t("securityNote")}</p>
      </motion.div>
    </AdminLoginShell>
  );
}
