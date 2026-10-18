"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import {
  useStaffUser,
  useStaffUserMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { getErrorMessage } from "@/features/admin/lib/errors";
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
import { useRouter } from "@/i18n/routing";
import { ApiError } from "@/lib/api/errors";
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
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.staff");
  const to = useTranslations("admin.pages.operations");
  const router = useRouter();
  const { user: currentUser } = useAdminShell();
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
          err instanceof ApiError && err.code === "CONFLICT"
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
      router.replace(`${BASE}/${created.id}/edit`);
      router.refresh();
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
      <p className="p-8 text-center text-sm text-[#6b6b6b]">{t("loading")}</p>
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
          icon="badge"
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
                disabled={!isSuperadmin}
              >
                <option value="admin">{tp("roles.admin")}</option>
                {isSuperadmin ? (
                  <option value="superadmin">{tp("roles.superadmin")}</option>
                ) : null}
              </AdminSelect>
              {!isSuperadmin ? (
                <p className="mt-1 text-xs text-[#6b6b6b]">{tp("roleHint")}</p>
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
    </AdminDetailPage>
  );
}
