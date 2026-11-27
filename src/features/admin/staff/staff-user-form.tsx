"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AccountCreatedDialog } from "@/features/admin/components/account-created-dialog";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import {
  AdminField,
  AdminPasswordInput,
  AdminSelect,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormError,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { PersonPreview } from "@/features/admin/components/form-previews";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import { AdminDangerZone } from "@/features/admin/crud/admin-danger-zone";
import {
  useStaffUser,
  useStaffUserMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { generateReadablePassword } from "@/features/admin/lib/password";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import {
  type CreateStaffUserValues,
  createStaffUserSchema,
  type UpdateStaffUserValues,
  updateStaffUserSchema,
} from "@/features/admin/staff/schemas";
import { StaffResetPasswordDialog } from "@/features/admin/staff/staff-reset-password-dialog";
import { useRouter } from "@/i18n/routing";
import { ApiError } from "@/lib/api/errors";
import type { StaffUser } from "@/lib/types/admin";
import { UserRole } from "@/lib/types/auth";

const BASE = "/admin/staff";

const emptyCreateForm: CreateStaffUserValues = {
  name: "",
  email: "",
  password: "",
  role: "admin",
};

const emptyEditForm: UpdateStaffUserValues = {
  name: "",
  email: "",
  role: "admin",
};

export function StaffUserForm({ id }: { id?: string }) {
  const [created, setCreated] = useState<{
    id: string;
    name: string;
    login: string;
    password: string;
  } | null>(null);
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.staff");
  const to = useTranslations("admin.pages.operations");
  const router = useRouter();
  const { user: currentUser } = useAdminShell();
  // Changing your own role could lock you out of this page.
  const isOwnAccount = !!id && id === currentUser.id;
  const isEdit = !!id;
  const isSuperadmin = currentUser.role === UserRole.SUPERADMIN;
  const { data: staffUser, isLoading } = useStaffUser(id ?? "", isEdit);
  const mutations = useStaffUserMutations();
  const [form, setForm] = useState<
    CreateStaffUserValues | UpdateStaffUserValues
  >(isEdit ? emptyEditForm : emptyCreateForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (staffUser) {
      setForm({
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role,
      });
    }
  }, [staffUser]);

  const isDirty =
    !staffUser ||
    form.name !== staffUser.name ||
    form.email !== staffUser.email ||
    form.role !== staffUser.role;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (isEdit && id) {
      const parsed = updateStaffUserSchema({
        nameRequired: tp("validation.nameRequired"),
        emailInvalid: tp("validation.emailInvalid"),
      }).safeParse(form);
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? t("saveFailed"));
        return;
      }

      try {
        await mutations.update.mutateAsync({ id, ...parsed.data });
        showApiSuccess(t("updated"));
        router.refresh();
      } catch (err) {
        const msg =
          err instanceof ApiError &&
          err.code === "CONFLICT" &&
          err.message.toLowerCase().includes("last superadmin")
            ? tp("lastSuperadminRole")
            : err instanceof ApiError && err.code === "CONFLICT"
              ? tp("emailExists")
              : err instanceof ApiError && err.code === "FORBIDDEN"
                ? tp("forbiddenAction")
                : getErrorMessage(err, t("saveFailed"));
        setFormError(msg);
        showApiError(err, msg);
      }
      return;
    }

    const parsed = createStaffUserSchema({
      nameRequired: tp("validation.nameRequired"),
      emailInvalid: tp("validation.emailInvalid"),
      passwordMin: tp("validation.passwordMin"),
    }).safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t("saveFailed"));
      return;
    }

    try {
      const created = await mutations.create.mutateAsync(parsed.data);
      showApiSuccess(t("created"));
      setCreated({
        id: created.id,
        name: parsed.data.name,
        login: parsed.data.email,
        password: parsed.data.password,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "CONFLICT"
          ? tp("emailExists")
          : err instanceof ApiError && err.code === "FORBIDDEN"
            ? tp("forbiddenAction")
            : getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, msg);
    }
  }

  const pending = mutations.create.isPending || mutations.update.isPending;

  if (!isSuperadmin) {
    return (
      <div className="p-8">
        <AdminAlert message={tp("forbiddenAction")} />
      </div>
    );
  }

  if (isEdit && isLoading) {
    return (
      <p className="p-8 text-center text-sm text-fg-muted">{t("loading")}</p>
    );
  }

  return (
    <AdminDetailPage
      section={tp("title")}
      mode={isEdit ? "edit" : "create"}
      aside={
        <PersonPreview
          name={form.name}
          email={form.email}
          role={form.role}
          roleLabel={tp(`roles.${form.role}`)}
          roleHint={to(`roleCan.${form.role}`)}
        />
      }
      backHref={BASE}
      backLabel={t("backToList")}
      title={isEdit ? staffUser?.name || tp("editTitle") : tp("createTitle")}
      description={isEdit ? tp("editDescription") : tp("formDescription")}
      wide={false}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <AdminFormError message={formError} />

        <AdminFormSection
          icon={adminPageIcons.staff}
          title={tp("identityTitle")}
          hint={tp("identityHint")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label={t("name")} htmlFor="staff-name" required>
              <input
                id="staff-name"
                required
                autoComplete="name"
                className={adminInputClassName}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </AdminField>
            <AdminField label={t("email")} htmlFor="staff-email" required>
              <input
                id="staff-email"
                type="email"
                required
                autoComplete="email"
                className={adminInputClassName}
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </AdminField>
            <AdminField label={tp("role")} htmlFor="staff-role" required>
              <AdminSelect
                id="staff-role"
                required
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as CreateStaffUserValues["role"],
                  }))
                }
                disabled={!isSuperadmin || isOwnAccount}
              >
                <option value="admin">{tp("roles.admin")}</option>
                {isSuperadmin ? (
                  <option value="superadmin">{tp("roles.superadmin")}</option>
                ) : null}
              </AdminSelect>
              {isOwnAccount ? (
                <p className="mt-1 text-xs text-fg-muted">
                  {tp("ownRoleHint")}
                </p>
              ) : !isSuperadmin ? (
                <p className="mt-1 text-xs text-fg-muted">{tp("roleHint")}</p>
              ) : null}
            </AdminField>
          </div>
        </AdminFormSection>

        {!isEdit ? (
          <AdminFormSection
            icon="lock"
            title={tp("credentialsTitle")}
            hint={tp("passwordHint")}
          >
            <AdminField
              label={tp("password")}
              htmlFor="staff-password"
              required
            >
              <AdminPasswordInput
                id="staff-password"
                required
                value={"password" in form ? form.password : ""}
                onChange={(password) => setForm((f) => ({ ...f, password }))}
                showLabel={tp("showPassword")}
                hideLabel={tp("hidePassword")}
              />
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    password: generateReadablePassword(),
                  }))
                }
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
              >
                <Icon name="auto_awesome" size={16} />
                {tp("generatePassword")}
              </button>
            </AdminField>
          </AdminFormSection>
        ) : null}

        <AdminFormActions
          cancelHref={BASE}
          cancelLabel={t("cancel")}
          pending={pending}
          submitDisabled={isEdit && !isDirty}
          dirty={isEdit ? isDirty : undefined}
          submitLabel={isEdit ? tp("saveDetails") : tp("createTitle")}
          pendingLabel={t("saving")}
        />
      </form>
      {isEdit && staffUser && isSuperadmin && !isOwnAccount ? (
        <StaffAccountActions user={staffUser} />
      ) : null}
      <AccountCreatedDialog
        open={created !== null}
        name={created?.name ?? ""}
        login={created?.login ?? ""}
        password={created?.password ?? ""}
        onDone={() => {
          if (!created) return;
          router.replace(`${BASE}/${created.id}/edit`);
          router.refresh();
        }}
      />
    </AdminDetailPage>
  );
}

/** Password, access and delete for one staff account, on its own edit page. */
function StaffAccountActions({ user }: { user: StaffUser }) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.staff");
  const router = useRouter();
  const mutations = useStaffUserMutations();
  const [resetOpen, setResetOpen] = useState(false);
  // Two taps for deactivate: a mis-tap shouldn't lock someone out.
  const [confirmToggle, setConfirmToggle] = useState(false);

  async function toggleActive() {
    const nextActive = !user.isActive;
    try {
      await mutations.setActive.mutateAsync({
        id: user.id,
        isActive: nextActive,
      });
      showApiSuccess(
        nextActive ? tp("activateSuccess") : tp("deactivateSuccess"),
      );
      setConfirmToggle(false);
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "CONFLICT"
          ? tp("deactivateBlocked")
          : err instanceof ApiError && err.code === "FORBIDDEN"
            ? tp("forbiddenAction")
            : getErrorMessage(err, t("saveFailed"));
      showApiError(err, msg);
    }
  }

  async function remove() {
    try {
      await mutations.remove.mutateAsync(user.id);
      showApiSuccess(t("deleted"));
      router.replace(BASE);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "CONFLICT"
          ? err.message.toLowerCase().includes("last superadmin")
            ? tp("deleteLastSuperadminBlocked")
            : tp("deleteBlocked")
          : err instanceof ApiError && err.code === "FORBIDDEN"
            ? tp("forbiddenAction")
            : getErrorMessage(err, t("deleteFailed"));
      showApiError(err, msg);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-base font-semibold text-fg">
          {tp("accountTitle")}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line-strong px-4 text-sm font-medium text-fg hover:bg-hover"
          >
            <Icon name="lock_reset" size={16} />
            {tp("resetPassword")}
          </button>
          {confirmToggle ? (
            <span className="flex flex-wrap items-center gap-2 text-sm text-fg-2">
              {user.isActive ? tp("deactivateAsk") : tp("activateAsk")}
              <button
                type="button"
                disabled={mutations.setActive.isPending}
                onClick={() => void toggleActive()}
                className="inline-flex h-10 items-center rounded-md bg-ink px-4 font-medium text-white disabled:opacity-50"
              >
                {user.isActive ? tp("deactivate") : tp("activate")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmToggle(false)}
                className="inline-flex h-10 items-center rounded-md px-3 font-medium text-fg-2 hover:bg-hover"
              >
                {t("cancel")}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmToggle(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line-strong px-4 text-sm font-medium text-fg hover:bg-hover"
            >
              <Icon
                name={user.isActive ? "person_off" : "person_check"}
                size={16}
              />
              {user.isActive ? tp("deactivate") : tp("activate")}
            </button>
          )}
        </div>
      </section>
      <AdminDangerZone
        itemName={user.name}
        hint={tp("deleteHint")}
        pending={mutations.remove.isPending}
        onDelete={remove}
      />
      <StaffResetPasswordDialog
        user={user}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />
    </div>
  );
}
