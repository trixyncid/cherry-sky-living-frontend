"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Icon } from "@/components/shared/Icon";
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
  createAdminPasswordSchema,
  createAdminProfileSchema,
  type AdminPasswordValues,
  type AdminProfileValues,
} from "@/features/admin/profile/schemas";
import {
  useAdminProfile,
  useAdminProfileMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const emptyProfile: AdminProfileValues = { name: "" };

const emptyPassword: AdminPasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function roleBadgeClass(role: string) {
  return role === "superadmin"
    ? "bg-brand-soft text-brand ring-1 ring-brand/15"
    : "bg-hover text-fg-2 ring-1 ring-line";
}

export function AdminProfileView() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.profile");
  const locale = useLocale();
  const ts = useTranslations("admin.pages.staff");
  const router = useRouter();
  const { data: profile, isLoading, error } = useAdminProfile();
  const mutations = useAdminProfileMutations();

  const [profileForm, setProfileForm] = useState<AdminProfileValues>(emptyProfile);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] =
    useState<AdminPasswordValues>(emptyPassword);
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

    const parsed = createAdminProfileSchema({
      nameRequired: tp("validation.nameRequired"),
    }).safeParse(profileForm);
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

    const parsed = createAdminPasswordSchema({
      currentPasswordRequired: tp("validation.currentPasswordRequired"),
      newPasswordMin: tp("validation.newPasswordMin"),
      confirmPasswordRequired: tp("validation.confirmPasswordRequired"),
      passwordsMismatch: tp("validation.passwordsMismatch"),
    }).safeParse(passwordForm);
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
        <p className="text-sm text-fg-muted">{t("loading")}</p>
      ) : profile ? (
        <div className="space-y-6">
          <section className="glass-panel rounded-[1.75rem] p-6">
            <div className="mb-6 flex items-center gap-5">
              <ProfileAvatarPlaceholder
                className="size-20 ring-4 ring-line"
                iconSize={36}
                label={profile.name}
              />
              <div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize backdrop-blur-sm",
                    roleBadgeClass(profile.role),
                  )}
                >
                  {ts(`roles.${profile.role}` as "roles.admin" | "roles.superadmin")}
                </span>
                <p className="mt-2 text-xs text-fg-muted">
                  {tp("memberSince")}: {formatDate(profile.createdAt, locale)}
                </p>
              </div>
            </div>

            <h3 className="mb-4 text-sm font-semibold text-fg">
              {tp("accountSection")}
            </h3>

            <form onSubmit={(e) => void handleProfileSubmit(e)} className="space-y-4">
              {profileError && <AdminAlert message={profileError} />}

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label={t("name")} htmlFor="admin-profile-name" required>
                  <input
                    id="admin-profile-name"
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
                <AdminField label={t("email")} htmlFor="admin-profile-email">
                  <input
                    id="admin-profile-email"
                    type="email"
                    value={profile.email}
                    readOnly
                    disabled
                    className={cn(
                      adminInputClassName,
                      "cursor-not-allowed bg-hover text-fg-2",
                    )}
                  />
                  <p className="mt-1 text-xs text-fg-muted">{tp("emailReadOnly")}</p>
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
            <h3 className="mb-1 text-sm font-semibold text-fg">
              {tp("passwordSection")}
            </h3>
            <p className="mb-4 text-sm text-fg-2">{tp("passwordDescription")}</p>

            <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
              {passwordError && <AdminAlert message={passwordError} />}

              <AdminField label={tp("currentPassword")} htmlFor="admin-current-password" required>
                <PasswordInput
                  id="admin-current-password"
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
                <AdminField label={tp("newPassword")} htmlFor="admin-new-password" required>
                  <PasswordInput
                    id="admin-new-password"
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
                <AdminField label={tp("confirmPassword")} htmlFor="admin-confirm-password" required>
                  <PasswordInput
                    id="admin-confirm-password"
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
                  className="glass-control rounded-xl px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-hover disabled:opacity-50"
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
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-fg-muted transition-colors hover:text-brand"
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
