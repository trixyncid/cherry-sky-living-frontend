"use client";

import { useForm } from "@tanstack/react-form";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { RequiredMark } from "@/components/shared/required-mark";
import { useRouter } from "@/i18n/routing";
import {
  adminLoginSchema,
  type AdminLoginValues,
} from "@/features/admin/login/schemas";
import { AdminLoginShell } from "@/features/admin/login/admin-login-shell";
import { authClient } from "@/lib/auth/client";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { getRoleFromAuthUser, getRoleFromSignInData } from "@/lib/auth/post-login";
import { getHomePathForRole } from "@/lib/auth/redirects";
import { loginErrorKeyFromAuthError, type LoginErrorKey } from "@/lib/auth/errors";
import { assertCanAccessAdminPortal } from "@/lib/auth/role";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const fieldMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2 + i * 0.06,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const inputClassName = cn(
  "glass-control block w-full rounded-xl py-2.5 pl-10 pr-3 text-base text-[#1a1c1a]",
  "transition-all placeholder:text-[#51443c]/50",
  "focus:outline-none focus:ring-2 focus:ring-ferrugem/20",
);

function showLoginError(
  t: ReturnType<typeof useTranslations<"admin.login">>,
  key: LoginErrorKey,
) {
  toast.error(t(`errors.${key}.title`), {
    description: t(`errors.${key}.description`),
  });
}

export function AdminLoginForm() {
  const t = useTranslations("admin.login");
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
      email: "",
      password: "",
    } satisfies AdminLoginValues,
    onSubmit: async ({ value }) => {
      const parsed = adminLoginSchema.safeParse(value);
      if (!parsed.success) {
        showLoginError(t, "invalid");
        return;
      }

      const result = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (result.error) {
        showLoginError(t, loginErrorKeyFromAuthError(result.error));
        return;
      }

      let role =
        getRoleFromSignInData(result.data) ??
        getRoleFromAuthUser(
          (await authClient.getSession()).data?.user as
            | Record<string, unknown>
            | undefined,
        );

      if (!role) {
        const retry = await authClient.getSession();
        role = getRoleFromAuthUser(
          retry.data?.user as Record<string, unknown> | undefined,
        );
      }

      const access = assertCanAccessAdminPortal(role);

      if (!access.ok || !role) {
        await signOutClient();
        showLoginError(t, access.isTenant ? "forbidden" : "invalid");
        return;
      }

      toast.success(t("success"));
      router.refresh();
      router.push(getHomePathForRole(role));
    },
  });

  return (
    <AdminLoginShell>
      <motion.div variants={fieldMotion} custom={0} initial="hidden" animate="visible">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-[#1a1c1a]">
          {t("title")}
        </h1>
        <p className="mt-1 text-center text-base text-[#51443c]">{t("subtitle")}</p>
      </motion.div>

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <motion.div
              variants={fieldMotion}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-semibold tracking-wide text-[#1a1c1a]"
                aria-required
              >
                {t("emailLabel")}
                <RequiredMark className="ml-0.5" />
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon name="mail" size={20} className="text-[#5f5e5e]" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
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
                htmlFor="admin-password"
                className="mb-2 block text-sm font-semibold tracking-wide text-[#1a1c1a]"
                aria-required
              >
                {t("passwordLabel")}
                <RequiredMark className="ml-0.5" />
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon name="lock" size={20} className="text-[#5f5e5e]" />
                </div>
                <input
                  id="admin-password"
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
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5f5e5e] transition-colors hover:text-[#6f4627]"
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
                  "admin-btn-primary mt-2 flex w-full items-center justify-center rounded-xl border border-transparent",
                  "px-4 py-2.5 text-sm font-semibold",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-ferrugem focus:ring-offset-2",
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
        className="mt-8 border-t border-white/40 pt-6 text-center"
        variants={fieldMotion}
        custom={4}
        initial="hidden"
        animate="visible"
      >
        <p className="text-xs font-medium text-[#5f5e5e]">{t("securityNote")}</p>
      </motion.div>
    </AdminLoginShell>
  );
}
