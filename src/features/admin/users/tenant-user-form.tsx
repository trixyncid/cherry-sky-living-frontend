"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormError,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import {
  AdminField,
  AdminPasswordInput,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { useTenantUserMutations } from "@/features/admin/hooks/use-admin-queries";
import {
  createTenantUserSchema,
  type CreateTenantUserValues,
} from "@/features/admin/users/schemas";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import { ApiError } from "@/lib/api/errors";

const BASE = "/admin/users";

const emptyForm: CreateTenantUserValues = {
  name: "",
  email: "",
  password: "",
};

export function TenantUserForm() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.users");
  const router = useRouter();
  const mutations = useTenantUserMutations();
  const [form, setForm] = useState<CreateTenantUserValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = createTenantUserSchema({
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
      router.push(`${BASE}/${created.id}`);
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "CONFLICT"
          ? tp("emailExists")
          : getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, msg);
    }
  }

  const pending = mutations.create.isPending;

  return (
    <AdminDetailPage
      backHref={BASE}
      backLabel={t("backToList")}
      title={tp("createTitle")}
      description={tp("formDescription")}
      wide={false}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <AdminFormError message={formError} />

        <AdminFormSection
          icon="person"
          title={tp("identityTitle")}
          hint={tp("identityHint")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label={t("name")} htmlFor="tenant-name" required>
              <input
                id="tenant-name"
                required
                autoComplete="name"
                className={adminInputClassName}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </AdminField>
            <AdminField label={t("email")} htmlFor="tenant-email" required>
              <input
                id="tenant-email"
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
          </div>
        </AdminFormSection>

        <AdminFormSection
          icon="lock"
          title={tp("credentialsTitle")}
          hint={tp("passwordHint")}
        >
          <AdminField label={tp("password")} htmlFor="tenant-password" required>
            <AdminPasswordInput
              id="tenant-password"
              required
              value={form.password}
              onChange={(password) => setForm((f) => ({ ...f, password }))}
              showLabel={tp("showPassword")}
              hideLabel={tp("hidePassword")}
            />
          </AdminField>
        </AdminFormSection>

        <AdminFormActions
          cancelHref={BASE}
          cancelLabel={t("cancel")}
          pending={pending}
          submitLabel={tp("createTitle")}
          pendingLabel={t("saving")}
        />
      </form>
    </AdminDetailPage>
  );
}
