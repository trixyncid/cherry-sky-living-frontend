"use client";

import { useForm } from "@tanstack/react-form";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CountryPhoneInput } from "@/components/shared/country-phone-input";
import { Icon } from "@/components/shared/Icon";
import {
  AdminLoginShell,
  LoginField,
  LoginSubmit,
  PasswordToggle,
} from "@/features/admin/login/admin-login-shell";
import {
  resolveTenantLogin,
  type TenantLoginMethod,
  type TenantLoginValues,
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
import { cn } from "@/lib/utils";

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
      method: "phone",
      phone: "",
      email: "",
      password: "",
    } as TenantLoginValues,
    onSubmit: async ({ value }) => {
      const resolved = resolveTenantLogin(value);
      if (!resolved) {
        showLoginError(t, "invalid");
        return;
      }

      const result =
        resolved.kind === "email"
          ? await authClient.signIn.email({
              email: resolved.email,
              password: resolved.password,
            })
          : await authClient.signIn.phoneNumber({
              phoneNumber: resolved.phoneNumber,
              password: resolved.password,
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
        <form.Field name="method">
          {(methodField) => {
            const method = methodField.state.value;
            return (
              <>
                <MethodSwitch
                  value={method}
                  onChange={(next) => methodField.handleChange(next)}
                  label={t("methodLabel")}
                  phoneLabel={t("methodPhone")}
                  emailLabel={t("methodEmail")}
                />
                {method === "phone" ? (
                  <form.Field name="phone">
                    {(field) => (
                      <div>
                        <label
                          htmlFor="tenant-phone"
                          className="mb-2 block text-sm font-medium text-fg"
                        >
                          {t("phoneLabel")}
                        </label>
                        <CountryPhoneInput
                          id="tenant-phone"
                          size="lg"
                          autoComplete="tel"
                          required
                          value={field.state.value}
                          onChange={(v) => field.handleChange(v)}
                        />
                        <p className="mt-1.5 text-xs text-fg-muted">
                          {t("phoneHint")}
                        </p>
                      </div>
                    )}
                  </form.Field>
                ) : (
                  <form.Field name="email">
                    {(field) => (
                      <LoginField
                        id="tenant-email"
                        label={t("emailLabel")}
                        icon="mail"
                        type="email"
                        autoComplete="username"
                        inputMode="email"
                        placeholder={t("emailPlaceholder")}
                        required
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    )}
                  </form.Field>
                )}
              </>
            );
          }}
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

/** Phone / Email segmented switch above the sign-in fields. */
function MethodSwitch({
  value,
  onChange,
  label,
  phoneLabel,
  emailLabel,
}: {
  value: TenantLoginMethod;
  onChange: (value: TenantLoginMethod) => void;
  label: string;
  phoneLabel: string;
  emailLabel: string;
}) {
  const options: { value: TenantLoginMethod; label: string; icon: string }[] = [
    { value: "phone", label: phoneLabel, icon: "smartphone" },
    { value: "email", label: emailLabel, icon: "mail" },
  ];
  return (
    <fieldset className="grid grid-cols-2 gap-1 rounded-2xl bg-subtle p-1">
      <legend className="sr-only">{label}</legend>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30",
              selected
                ? "bg-white text-fg shadow-[0_1px_3px_rgb(11_11_13/0.08)]"
                : "text-fg-muted hover:text-fg",
            )}
          >
            <input
              type="radio"
              name="tenant-login-method"
              value={o.value}
              checked={selected}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <Icon name={o.icon} size={18} />
            {o.label}
          </label>
        );
      })}
    </fieldset>
  );
}
