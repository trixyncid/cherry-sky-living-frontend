"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormError,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import {
  AdminCurrencyInput,
  AdminField,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { AdminImageGallery } from "@/features/admin/components/admin-image-gallery";
import {
  useProperty,
  usePropertyMutations,
} from "@/features/admin/hooks/use-admin-queries";
import {
  deletePropertyAttachment,
  uploadPropertyImage,
} from "@/lib/api/admin/attachments";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  formatIdrInput,
  parseIdrInput,
} from "@/features/admin/lib/format";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import { adminKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

const BASE = "/admin/properties";

type FormState = {
  name: string;
  address: string;
  city: string;
  paymentDueDay: string;
  lateFeePerDay: string;
  renewalConfirmDaysBeforeEnd: string;
};

const emptyForm: FormState = {
  name: "",
  address: "",
  city: "",
  paymentDueDay: "5",
  lateFeePerDay: formatIdrInput(100000),
  renewalConfirmDaysBeforeEnd: "5",
};

export function PropertyForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.properties");
  const ta = useTranslations("admin.attachments");
  const router = useRouter();
  const qc = useQueryClient();
  const isEdit = !!id;
  const { data: property, isLoading } = useProperty(id ?? "", isEdit);
  const mutations = usePropertyMutations();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const attachments = property?.propertyAttachments ?? [];

  function invalidateProperty() {
    void qc.invalidateQueries({ queryKey: adminKeys.properties.all() });
    if (id) {
      void qc.invalidateQueries({ queryKey: adminKeys.properties.detail(id) });
    }
  }

  useEffect(() => {
    if (property) {
      setForm({
        name: property.name,
        address: property.address,
        city: property.city,
        paymentDueDay: String(property.paymentDueDay ?? 5),
        lateFeePerDay: formatIdrInput(property.lateFeePerDay ?? 100000),
        renewalConfirmDaysBeforeEnd: String(
          property.renewalConfirmDaysBeforeEnd ?? 5,
        ),
      });
    }
  }, [property]);

  const isDirty =
    !property ||
    form.name !== property.name ||
    form.address !== property.address ||
    form.city !== property.city ||
    form.paymentDueDay !== String(property.paymentDueDay ?? 5) ||
    parseIdrInput(form.lateFeePerDay) !== (property.lateFeePerDay ?? 100000) ||
    form.renewalConfirmDaysBeforeEnd !==
      String(property.renewalConfirmDaysBeforeEnd ?? 5);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const payload = {
      name: form.name,
      address: form.address,
      city: form.city,
      paymentDueDay: Number(form.paymentDueDay),
      lateFeePerDay: parseIdrInput(form.lateFeePerDay),
      renewalConfirmDaysBeforeEnd: Number(form.renewalConfirmDaysBeforeEnd),
    };
    try {
      if (isEdit && id) {
        await mutations.update.mutateAsync({ id, ...payload });
        invalidateProperty();
        showApiSuccess(t("updated"));
      } else {
        const created = await mutations.create.mutateAsync(payload);
        showApiSuccess(tp("createdStayToUpload"));
        router.replace(`${BASE}/${created.id}/edit`);
        router.refresh();
      }
    } catch (err) {
      const msg = getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, t("saveFailed"));
    }
  }

  async function handleImageUpload(files: File[]) {
    if (!isEdit || !id) {
      setImageError(tp("saveFirstToUpload"));
      return;
    }

    setImageError(null);
    const results = await Promise.allSettled(
      files.map((file) => uploadPropertyImage(id, file)),
    );
    const succeeded = results.filter((result) => result.status === "fulfilled");
    const failed = results.filter((result) => result.status === "rejected");

    if (succeeded.length > 0) {
      showApiSuccess(
        succeeded.length === 1
          ? tp("imageUploaded")
          : tp("imagesUploaded", { count: succeeded.length }),
      );
      invalidateProperty();
    }

    if (failed.length > 0) {
      const first = failed[0];
      const reason = first && first.status === "rejected" ? first.reason : null;
      const msg = getErrorMessage(reason, tp("imageUploadFailed"));
      setImageError(
        failed.length > 1
          ? tp("imagesUploadPartial", {
              failed: failed.length,
              total: files.length,
            })
          : msg,
      );
      showApiError(reason, msg);
      if (succeeded.length === 0) {
        throw reason instanceof Error ? reason : new Error(msg);
      }
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    try {
      await deletePropertyAttachment(attachmentId);
      showApiSuccess(ta("deleted"));
      invalidateProperty();
    } catch (err) {
      showApiError(err, ta("deleteFailed"));
      throw err;
    }
  }

  const pending =
    mutations.create.isPending ||
    mutations.update.isPending ||
    (isEdit && isLoading);

  if (isEdit && isLoading && !property) {
    return <p className="text-sm text-[#83746b]">{t("loading")}</p>;
  }

  const photoCount = attachments.length;

  return (
    <AdminDetailPage
      backHref={BASE}
      backLabel={t("backToList")}
      title={isEdit ? property?.name || t("editTitle") : t("createTitle")}
      description={isEdit ? tp("editDescription") : tp("formDescription")}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-6"
        >
          <AdminFormError message={formError} />

          <AdminFormSection
            icon="apartment"
            title={tp("identityTitle")}
            hint={tp("identityHint")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label={t("name")} htmlFor="prop-name" required>
                <input
                  id="prop-name"
                  required
                  autoComplete="organization"
                  className={adminInputClassName}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </AdminField>
              <AdminField label={t("city")} htmlFor="prop-city" required>
                <input
                  id="prop-city"
                  required
                  autoComplete="address-level2"
                  className={adminInputClassName}
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
              </AdminField>
              <AdminField
                label={t("address")}
                htmlFor="prop-address"
                required
                className="sm:col-span-2"
              >
                <input
                  id="prop-address"
                  required
                  autoComplete="street-address"
                  className={adminInputClassName}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </AdminField>
            </div>
          </AdminFormSection>

          <AdminFormSection
            icon="payments"
            title={tp("paymentRulesTitle")}
            hint={tp("paymentRulesHint")}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <AdminField
                label={tp("paymentDueDay")}
                htmlFor="prop-due-day"
                required
              >
                <input
                  id="prop-due-day"
                  type="number"
                  min={1}
                  max={28}
                  required
                  className={adminInputClassName}
                  value={form.paymentDueDay}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentDueDay: e.target.value }))
                  }
                />
                <p className="mt-1 text-xs text-[#83746b]">
                  {tp("paymentDueDayHint")}
                </p>
              </AdminField>
              <AdminField
                label={tp("lateFeePerDay")}
                htmlFor="prop-late-fee"
                required
              >
                <AdminCurrencyInput
                  id="prop-late-fee"
                  required
                  value={form.lateFeePerDay}
                  onValueChange={(lateFeePerDay) =>
                    setForm((f) => ({ ...f, lateFeePerDay }))
                  }
                />
                <p className="mt-1 text-xs text-[#83746b]">
                  {tp("lateFeeHint")}
                </p>
              </AdminField>
              <AdminField
                label={tp("renewalConfirmDays")}
                htmlFor="prop-renewal-days"
                required
              >
                <input
                  id="prop-renewal-days"
                  type="number"
                  min={1}
                  max={28}
                  required
                  className={adminInputClassName}
                  value={form.renewalConfirmDaysBeforeEnd}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      renewalConfirmDaysBeforeEnd: e.target.value,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-[#83746b]">
                  {tp("renewalHint")}
                </p>
              </AdminField>
            </div>
          </AdminFormSection>

          <AdminFormActions
            cancelHref={BASE}
            cancelLabel={t("cancel")}
            pending={pending}
            submitDisabled={isEdit && !isDirty}
            submitLabel={isEdit ? tp("saveDetails") : tp("saveAndAddPhotos")}
            pendingLabel={t("saving")}
          />
        </form>

        <aside className={cn("lg:sticky lg:top-6", isEdit && "max-lg:order-first")}>
          <AdminFormSection
            icon="photo_library"
            title={tp("photosTitle")}
            hint={isEdit ? tp("photosHint") : tp("photosHintCreate")}
            headerExtra={
              isEdit && photoCount > 0 ? (
                <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#51443c]">
                  {ta("photoCount", { count: photoCount })}
                </span>
              ) : null
            }
          >
            <AdminImageGallery
              attachments={attachments}
              onUpload={handleImageUpload}
              onDelete={handleDeleteAttachment}
              disabled={!isEdit}
              disabledTitle={ta("lockedTitle")}
              disabledHint={ta("lockedHint")}
              error={imageError}
            />
          </AdminFormSection>
        </aside>
      </div>
    </AdminDetailPage>
  );
}
