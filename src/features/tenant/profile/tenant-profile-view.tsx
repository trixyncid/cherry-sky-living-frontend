"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ProfileAvatarPlaceholder } from "@/components/shared/profile-avatar-placeholder";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import {
  AdminField,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { formatDate } from "@/features/admin/lib/format";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import {
  tenantPasswordSchema,
  tenantProfileSchema,
  type TenantPasswordValues,
  type TenantProfileValues,
} from "@/features/tenant/profile/schemas";
import {
  useTenantProfile,
  useTenantProfileMutations,
} from "@/features/tenant/hooks/use-tenant-queries";
import { Icon } from "@/components/shared/Icon";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const emptyProfile: TenantProfileValues = { name: "" };

const emptyPassword: TenantPasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function TenantProfileView() {
  const t = useTranslations("tenant.common");
  const th = useTranslations("tenant.header");
  const tp = useTranslations("tenant.pages.profile");
  const locale = useLocale();
  const router = useRouter();
  const { data: profile, isLoading, error } = useTenantProfile();
  const mutations = useTenantProfileMutations();

  const [profileForm, setProfileForm] = useState<TenantProfileValues>(emptyProfile);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] =
    useState<TenantPasswordValues>(emptyPassword);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({ name: profile.name });
    }
  }, [profile]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);

    const parsed = tenantProfileSchema.safeParse(profileForm);
    if (!parsed.success) {
      setProfileError(parsed.error.issues[0]?.message ?? tp("saveFailed"));
      return;
    }

    try {
      await mutations.updateProfile.mutateAsync({ name: parsed.data.name });
      showApiSuccess(tp("profileUpdated"));
      router.refresh();
    } catch (err) {
      const msg = getErrorMessage(err, tp("saveFailed"));
      setProfileError(msg);
      showApiError(err, tp("saveFailed"));
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    const parsed = tenantPasswordSchema.safeParse(passwordForm);
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? tp("passwordFailed"));
      return;
    }

    try {
      await mutations.changePassword.mutateAsync({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      });
      setPasswordForm(emptyPassword);
      showApiSuccess(tp("passwordUpdated"));
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 400
          ? tp("incorrectCurrentPassword")
          : getErrorMessage(err, tp("passwordFailed"));
      setPasswordError(msg);
      showApiError(err, tp("passwordFailed"));
    }
  }

  const profilePending = mutations.updateProfile.isPending;
  const passwordPending = mutations.changePassword.isPending;

  return (
    <>
      <AdminPageHeader title={tp("title")} description={tp("description")} />

      {error && (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-[#83746b]">{t("loading")}</p>
      ) : profile ? (
        <div className="space-y-6">
          <section className="glass-panel rounded-[1.75rem] p-6">
            <div className="mb-6 flex items-center gap-5">
              <ProfileAvatarPlaceholder
                className="size-20 ring-4 ring-white/70"
                iconSize={36}
                label={profile.name}
              />
              <div>
                <span className="inline-flex rounded-full bg-[#f5e4d4]/80 px-2.5 py-1 text-xs font-semibold text-[#6f4627] ring-1 ring-white/60 backdrop-blur-sm">
                  {th("roleTenant")}
                </span>
                <p className="mt-2 text-xs text-[#83746b]">
                  {tp("memberSince")}: {formatDate(profile.createdAt, locale)}
                </p>
              </div>
            </div>

            <h3 className="mb-4 text-sm font-semibold text-[#1a1c1a]">
              {tp("accountSection")}
            </h3>

            <form onSubmit={(e) => void handleProfileSubmit(e)} className="space-y-4">
              {profileError && <AdminAlert message={profileError} />}

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label={t("name")} htmlFor="profile-name" required>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ name: e.target.value })
                    }
                    className={adminInputClassName}
                    autoComplete="name"
                    required
                  />
                </AdminField>
                <AdminField label={t("email")} htmlFor="profile-email">
                  <input
                    id="profile-email"
                    type="email"
                    value={profile.email}
                    readOnly
                    disabled
                    className={cn(
                      adminInputClassName,
                      "cursor-not-allowed bg-[#efeeeb] text-[#51443c]",
                    )}
                  />
                  <p className="mt-1 text-xs text-[#83746b]">{tp("emailReadOnly")}</p>
                </AdminField>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profilePending}
                  className="admin-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {profilePending ? t("saving") : t("save")}
                </button>
              </div>
            </form>
          </section>

          <section className="glass-panel rounded-[1.75rem] p-6">
            <h3 className="mb-1 text-sm font-semibold text-[#1a1c1a]">
              {tp("passwordSection")}
            </h3>
            <p className="mb-4 text-sm text-[#51443c]">{tp("passwordDescription")}</p>

            <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
              {passwordError && <AdminAlert message={passwordError} />}

              <AdminField label={tp("currentPassword")} htmlFor="current-password" required>
                <PasswordInput
                  id="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(value) =>
                    setPasswordForm((f) => ({ ...f, currentPassword: value }))
                  }
                  show={showCurrentPassword}
                  onToggle={() => setShowCurrentPassword((v) => !v)}
                  showLabel={tp("showPassword")}
                  hideLabel={tp("hidePassword")}
                  autoComplete="current-password"
                />
              </AdminField>

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label={tp("newPassword")} htmlFor="new-password" required>
                  <PasswordInput
                    id="new-password"
                    value={passwordForm.newPassword}
                    onChange={(value) =>
                      setPasswordForm((f) => ({ ...f, newPassword: value }))
                    }
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword((v) => !v)}
                    showLabel={tp("showPassword")}
                    hideLabel={tp("hidePassword")}
                    autoComplete="new-password"
                  />
                </AdminField>
                <AdminField label={tp("confirmPassword")} htmlFor="confirm-password" required>
                  <PasswordInput
                    id="confirm-password"
                    value={passwordForm.confirmPassword}
                    onChange={(value) =>
                      setPasswordForm((f) => ({ ...f, confirmPassword: value }))
                    }
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((v) => !v)}
                    showLabel={tp("showPassword")}
                    hideLabel={tp("hidePassword")}
                    autoComplete="new-password"
                  />
                </AdminField>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordPending}
                  className="glass-control rounded-xl px-5 py-2.5 text-sm font-semibold text-[#6f4627] transition-colors hover:bg-white/80 disabled:opacity-50"
                >
                  {passwordPending ? tp("updatingPassword") : tp("updatePassword")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggle,
  showLabel,
  hideLabel,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(adminInputClassName, "pr-10")}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5f5e5e] transition-colors hover:text-[#6f4627]"
        aria-label={show ? hideLabel : showLabel}
      >
        <Icon
          name={show ? "visibility_off" : "visibility"}
          size={20}
        />
      </button>
    </div>
  );
}
