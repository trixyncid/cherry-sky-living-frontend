"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  AdminCurrencyInput,
  AdminField,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormError,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import { AdminImageGallery } from "@/features/admin/components/admin-image-gallery";
import { PropertyPreview } from "@/features/admin/components/form-previews";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import {
  useProperty,
  usePropertyMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { useAttachmentQueue } from "@/features/admin/hooks/use-attachment-queue";
import { useLeaveGuard } from "@/features/admin/hooks/use-leave-guard";
import { firstPhoto } from "@/features/admin/inventory/inventory-kit";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatIdrInput, parseIdrInput } from "@/features/admin/lib/format";
import { stashPendingUploads } from "@/features/admin/lib/pending-uploads";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { propertyFormSchema } from "@/features/admin/properties/schemas";
import { useRouter } from "@/i18n/routing";
import {
  deletePropertyAttachment,
  uploadPropertyImage,
} from "@/lib/api/admin/attachments";
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
  /** Optional; blank = not shown on the website. */
  depositAmount: string;
};

const emptyForm: FormState = {
  name: "",
  address: "",
  city: "",
  // Payment rules start blank: the owner sets them per property.
  paymentDueDay: "",
  lateFeePerDay: "",
  renewalConfirmDaysBeforeEnd: "",
  depositAmount: "",
};

/** Blank deposit = not set (null), not Rp 0. */
function depositFromInput(value: string): number | null {
  return value.trim() ? parseIdrInput(value) : null;
}

export function PropertyForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tq = useTranslations("admin.mobile.actions");
  const tp = useTranslations("admin.pages.properties");
  const ta = useTranslations("admin.attachments");
  const router = useRouter();
  const qc = useQueryClient();
  const isEdit = !!id;
  const { data: property, isLoading } = useProperty(id ?? "", isEdit);
  const mutations = usePropertyMutations();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const attachments = property?.propertyAttachments ?? [];

  function invalidateProperty() {
    void qc.invalidateQueries({ queryKey: adminKeys.properties.all() });
    if (id) {
      void qc.invalidateQueries({ queryKey: adminKeys.properties.detail(id) });
    }
  }

  const queue = useAttachmentQueue({
    upload: id ? (file) => uploadPropertyImage(id, file) : null,
    handoffKey: id ? `property:${id}` : undefined,
    onSettled: ({ succeeded, failed, firstError }) => {
      if (succeeded > 0) {
        invalidateProperty();
        showApiSuccess(ta("uploadedCount", { count: succeeded }));
      }
      if (failed > 0) {
        showApiError(firstError, ta("uploadFailedCount", { count: failed }));
      }
    },
  });
  useLeaveGuard(queue.hasUnsent, ta("leaveWarning"));

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
        depositAmount:
          property.depositAmount != null
            ? formatIdrInput(property.depositAmount)
            : "",
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
      String(property.renewalConfirmDaysBeforeEnd ?? 5) ||
    depositFromInput(form.depositAmount) !== (property.depositAmount ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // An empty late fee would otherwise parse as Rp 0.
    if (
      !form.paymentDueDay.trim() ||
      !form.lateFeePerDay.trim() ||
      !form.renewalConfirmDaysBeforeEnd.trim()
    ) {
      setFormError(tp("paymentRulesRequired"));
      return;
    }

    const parsed = propertyFormSchema.safeParse({
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      paymentDueDay: Number(form.paymentDueDay),
      lateFeePerDay: parseIdrInput(form.lateFeePerDay),
      renewalConfirmDaysBeforeEnd: Number(form.renewalConfirmDaysBeforeEnd),
      depositAmount: depositFromInput(form.depositAmount),
    });

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? t("saveFailed");
      setFormError(msg);
      return;
    }

    const payload = parsed.data;
    try {
      if (isEdit && id) {
        await mutations.update.mutateAsync({ id, ...payload });
        invalidateProperty();
        showApiSuccess(t("updated"));
      } else {
        const created = await mutations.create.mutateAsync(payload);
        // Files picked before saving upload on the edit page.
        const files = queue.takeAll();
        stashPendingUploads(`property:${created.id}`, files);
        showApiSuccess(
          files.length > 0
            ? ta("savedUploading", { count: files.length })
            : tp("createdStayToUpload"),
        );
        router.replace(`${BASE}/${created.id}/edit`);
        router.refresh();
      }
    } catch (err) {
      const msg = getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, t("saveFailed"));
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
    return <p className="text-sm text-fg-muted">{t("loading")}</p>;
  }

  const photoCount = attachments.length;

  return (
    <AdminDetailPage
      section={tp("title")}
      mode={isEdit ? "edit" : "create"}
      backHref={BASE}
      backLabel={t("backToList")}
      title={isEdit ? property?.name || t("editTitle") : tq("addProperty")}
      description={isEdit ? tp("editDescription") : tp("formDescription")}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <AdminFormError message={formError} />

          <AdminFormSection
            icon={adminPageIcons.properties}
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
                  placeholder={tp("paymentDueDayPlaceholder")}
                  className={adminInputClassName}
                  value={form.paymentDueDay}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentDueDay: e.target.value }))
                  }
                />
                <p className="mt-1 text-xs text-fg-muted">
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
                  placeholder={tp("lateFeePlaceholder")}
                  value={form.lateFeePerDay}
                  onValueChange={(lateFeePerDay) =>
                    setForm((f) => ({ ...f, lateFeePerDay }))
                  }
                />
                <p className="mt-1 text-xs text-fg-muted">
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
                  placeholder={tp("renewalDaysPlaceholder")}
                  className={adminInputClassName}
                  value={form.renewalConfirmDaysBeforeEnd}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      renewalConfirmDaysBeforeEnd: e.target.value,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-fg-muted">
                  {tp("renewalHint")}
                </p>
              </AdminField>
              <AdminField label={tp("deposit")} htmlFor="prop-deposit">
                <AdminCurrencyInput
                  id="prop-deposit"
                  placeholder={tp("depositPlaceholder")}
                  value={form.depositAmount}
                  onValueChange={(depositAmount) =>
                    setForm((f) => ({ ...f, depositAmount }))
                  }
                />
                <p className="mt-1 text-xs text-fg-muted">
                  {tp("depositHint")}
                </p>
              </AdminField>
            </div>
          </AdminFormSection>

          <AdminFormActions
            cancelHref={BASE}
            cancelLabel={t("cancel")}
            pending={pending}
            submitDisabled={isEdit && !isDirty}
            dirty={isEdit ? isDirty : undefined}
            submitLabel={isEdit ? tp("saveDetails") : tp("saveAndAddPhotos")}
            pendingLabel={t("saving")}
          />
        </form>

        <aside
          className={cn(
            "space-y-4 lg:sticky lg:top-4",
            isEdit && "max-lg:order-first",
          )}
        >
          <PropertyPreview
            name={form.name}
            city={form.city}
            address={form.address}
            photo={firstPhoto(attachments)}
            dueDay={form.paymentDueDay}
            lateFee={parseIdrInput(form.lateFeePerDay) || 0}
          />
          <AdminFormSection
            icon="photo_library"
            title={tp("photosTitle")}
            hint={isEdit ? tp("photosHint") : tp("photosHintCreate")}
            headerExtra={
              isEdit && photoCount > 0 ? (
                <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-fg-2">
                  {ta("photoCount", { count: photoCount })}
                </span>
              ) : null
            }
          >
            <AdminImageGallery
              attachments={attachments}
              queue={queue}
              onDelete={handleDeleteAttachment}
            />
          </AdminFormSection>
        </aside>
      </div>
    </AdminDetailPage>
  );
}
