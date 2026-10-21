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
  resolveTenantLoginIdentifier,
  type TenantLoginValues,
  tenantLoginSchema,
} from "@/features/tenant/login/schemas";
import { useRouter } from "@/i18n/routing";
import { getTenantProfile } from "@/lib/api/tenant/profile";
import { authClient } from "@/lib/auth/client";
import {
  type LoginErrorKey,
  loginErrorKeyFromAuthError,
} from "@/lib/auth/errors";
import { getHomePathForRole } from "@/lib/auth/redirects";
import {
  assertCanAccessTenantPortal,
  roleFromSessionUser,
} from "@/lib/auth/role";
import { signOutClient } from "@/lib/auth/sign-out-client";
import { toast } from "@/lib/toast";

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
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="identifier">
          {(field) => (
            <LoginField
              id="tenant-identifier"
              label={t("identifierLabel")}
              icon="person"
              type="text"
              autoComplete="username"
              inputMode="email"
              placeholder={t("identifierPlaceholder")}
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
              id="tenant-password"
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
