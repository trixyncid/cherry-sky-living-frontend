"use client";

import { useForm } from "@tanstack/react-form";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  AdminLoginShell,
  LoginField,
  LoginSubmit,
  PasswordToggle,
} from "@/features/admin/login/admin-login-shell";
import {
  type AdminLoginValues,
  adminLoginSchema,
} from "@/features/admin/login/schemas";
import { useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth/client";
import {
  type LoginErrorKey,
  loginErrorKeyFromAuthError,
} from "@/lib/auth/errors";
import {
  getRoleFromAuthUser,
  getRoleFromSignInData,
} from "@/lib/auth/post-login";
import { getHomePathForRole } from "@/lib/auth/redirects";
import { assertCanAccessAdminPortal } from "@/lib/auth/role";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { toast } from "@/lib/toast";

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
    <AdminLoginShell portal="admin">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <LoginField
              id="admin-email"
              label={t("emailLabel")}
              icon="mail"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <LoginField
              id="admin-password"
              label={t("passwordLabel")}
              icon="lock"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              trailing={
                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  showLabel={t("showPassword")}
                  hideLabel={t("hidePassword")}
                />
              }
            />
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <div className="pt-2">
              <LoginSubmit
                pending={!!isSubmitting}
                disabled={!canSubmit}
                label={t("submit")}
                pendingLabel={t("submitting")}
              />
            </div>
          )}
        </form.Subscribe>
      </form>
    </AdminLoginShell>
  );
}
