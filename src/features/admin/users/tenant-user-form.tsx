"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PhoneNumbersField } from "@/components/shared/phone-numbers-field";
import {
  AdminField,
  AdminPasswordInput,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormError,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import { PersonPreview } from "@/features/admin/components/form-previews";
import { useTenantUserMutations } from "@/features/admin/hooks/use-admin-queries";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { createTenantUserWithPhonesSchema } from "@/features/admin/users/schemas";
import { useRouter } from "@/i18n/routing";
import { ApiError } from "@/lib/api/errors";
import {
  emptyPhoneList,
  selectedLoginPhone,
  takenPhoneFromError,
  validatePhoneList,
} from "@/lib/phone-list";

const BASE = "/admin/users";

export function TenantUserForm() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.users");
  const router = useRouter();
  const mutations = useTenantUserMutations();
  const tph = useTranslations("common.phoneList");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [phones, setPhones] = useState(emptyPhoneList);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = createTenantUserWithPhonesSchema({
      nameRequired: tp("validation.nameRequired"),
      emailInvalid: tp("validation.emailInvalid"),
      passwordMin: tp("validation.passwordMin"),
    }).safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t("saveFailed"));
      return;
    }
    const phoneList = validatePhoneList(phones, {
      required: tph("required"),
      invalid: tph("invalid"),
      duplicate: tph("duplicate"),
    });
    if (!phoneList.ok) {
      setFormError(phoneList.error);
      return;
    }

    try {
      const created = await mutations.create.mutateAsync({
        ...parsed.data,
        ...phoneList.data,
      });
      showApiSuccess(t("created"));
      router.push(`${BASE}/${created.id}`);
      router.refresh();
    } catch (err) {
      const taken = takenPhoneFromError(err);
      const msg = taken
        ? tph("taken", { phone: taken })
        : err instanceof ApiError && err.code === "CONFLICT"
          ? tp("emailExists")
          : getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, msg);
    }
  }

  const pending = mutations.create.isPending;

  return (
    <AdminDetailPage
      section={tp("title")}
      mode={"create"}
      aside={
        <PersonPreview
          name={form.name}
          email={form.email}
          phone={selectedLoginPhone(phones) ?? ""}
        />
      }
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
            <AdminField label={tp("emailOptional")} htmlFor="tenant-email">
              <input
                id="tenant-email"
                type="email"
                autoComplete="email"
                className={adminInputClassName}
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <p className="mt-1 text-xs text-fg-muted">
                {tp("emailOptionalHint")}
              </p>
            </AdminField>
            <div className="sm:col-span-2">
              <PhoneNumbersField
                audience="admin"
                value={phones}
                onChange={setPhones}
              />
            </div>
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
