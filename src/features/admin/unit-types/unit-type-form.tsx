"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  AdminCurrencyInput,
  AdminField,
  AdminSelect,
  AdminTextarea,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormError,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import { AdminImageGallery } from "@/features/admin/components/admin-image-gallery";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { UnitTypePreview } from "@/features/admin/components/form-previews";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import {
  useUnitPricingMutations,
  useUnitType,
  useUnitTypeMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { useAttachmentQueue } from "@/features/admin/hooks/use-attachment-queue";
import { useLeaveGuard } from "@/features/admin/hooks/use-leave-guard";
import {
  dailyOf,
  firstPhoto,
  monthlyOf,
  type UnitTypeWithInventory,
} from "@/features/admin/inventory/inventory-kit";
import {
  readStoredPropertyId,
  writeStoredPropertyId,
} from "@/features/admin/lib/admin-property-scope";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatIdrInput, parseIdrInput } from "@/features/admin/lib/format";
import { stashPendingUploads } from "@/features/admin/lib/pending-uploads";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { unitTypeSizeSchema } from "@/features/admin/properties/schemas";
import { useRouter } from "@/i18n/routing";
import {
  deleteUnitTypeAttachment,
  uploadUnitTypeImage,
} from "@/lib/api/admin/attachments";
import { adminKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

const BASE = "/admin/unit-types";

type FormState = {
  name: string;
  description: string;
  propertyId: string;
  size: string;
  monthlyPrice: string;
  dailyPrice: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  propertyId: "",
  size: "",
  monthlyPrice: "",
  dailyPrice: "",
};

/** Saved prices as form text ("" when the type has none yet). */
function savedPrices(unitType: UnitTypeWithInventory | undefined) {
  const monthly = monthlyOf(unitType?.pricings);
  const daily = dailyOf(unitType?.pricings);
  return {
    monthlyPrice: monthly != null ? formatIdrInput(monthly) : "",
    dailyPrice: daily != null ? formatIdrInput(daily) : "",
  };
}

function resolveCreatePropertyId(
  properties: { id: string }[],
  fromQuery: string | null,
): string {
  if (fromQuery && properties.some((p) => p.id === fromQuery)) {
    return fromQuery;
  }
  const stored = readStoredPropertyId();
  if (stored && properties.some((p) => p.id === stored)) {
    return stored;
  }
  return properties[0]?.id ?? "";
}

export function UnitTypeForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tq = useTranslations("admin.mobile.actions");
  const tp = useTranslations("admin.pages.unitTypes");
  const tpr = useTranslations("admin.pages.pricing");
  const ta = useTranslations("admin.attachments");
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const isEdit = !!id;
  const { properties } = useAdminShell();
  const { data: unitType, isLoading } = useUnitType(id ?? "", isEdit);
  const mutations = useUnitTypeMutations();
  const priceMutations = useUnitPricingMutations();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const createPrefillDone = useRef(false);

  const attachments = unitType?.unitTypeAttachments ?? [];

  const queue = useAttachmentQueue({
    upload: id ? (file) => uploadUnitTypeImage(id, file) : null,
    handoffKey: id ? `unitType:${id}` : undefined,
    onSettled: ({ succeeded, failed, firstError }) => {
      if (succeeded > 0) {
        invalidateUnitType();
        showApiSuccess(ta("uploadedCount", { count: succeeded }));
      }
      if (failed > 0) {
        showApiError(firstError, ta("uploadFailedCount", { count: failed }));
      }
    },
  });
  useLeaveGuard(queue.hasUnsent, ta("leaveWarning"));

  function invalidateUnitType() {
    void qc.invalidateQueries({ queryKey: adminKeys.unitTypes.all() });
    if (id) {
      void qc.invalidateQueries({ queryKey: adminKeys.unitTypes.detail(id) });
    }
  }

  useEffect(() => {
    if (unitType) {
      setForm({
        name: unitType.name,
        description: unitType.description ?? "",
        propertyId: unitType.propertyId,
        size: unitType.size != null ? String(unitType.size) : "",
        ...savedPrices(unitType as UnitTypeWithInventory),
      });
      writeStoredPropertyId(unitType.propertyId);
    }
  }, [unitType]);

  useEffect(() => {
    if (isEdit || createPrefillDone.current || properties.length === 0) return;
    const propertyId = resolveCreatePropertyId(
      properties,
      searchParams.get("propertyId"),
    );
    createPrefillDone.current = true;
    if (!propertyId) return;
    setForm((f) => (f.propertyId ? f : { ...f, propertyId }));
    writeStoredPropertyId(propertyId);
  }, [isEdit, properties, searchParams]);

  const saved = savedPrices(unitType as UnitTypeWithInventory | undefined);
  const pricesChanged =
    form.monthlyPrice !== saved.monthlyPrice ||
    form.dailyPrice !== saved.dailyPrice;

  const isDirty =
    !unitType ||
    form.name !== unitType.name ||
    form.description !== (unitType.description ?? "") ||
    form.size !== (unitType.size != null ? String(unitType.size) : "") ||
    pricesChanged;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const sizeRaw = form.size.trim() ? Number(form.size) : null;
    const sizeParsed = unitTypeSizeSchema.safeParse(sizeRaw);
    if (!sizeParsed.success) {
      setFormError(sizeParsed.error.issues[0]?.message ?? t("saveFailed"));
      return;
    }
    const size = sizeParsed.data;
    const monthlyPrice = parseIdrInput(form.monthlyPrice);
    const dailyPrice = parseIdrInput(form.dailyPrice);
    // A type without both prices can't be booked, so they're required here.
    if (!Number.isFinite(monthlyPrice) || monthlyPrice <= 0) {
      setFormError(tpr("monthlyPriceRequired"));
      return;
    }
    if (!Number.isFinite(dailyPrice) || dailyPrice <= 0) {
      setFormError(tpr("dailyPriceRequired"));
      return;
    }

    try {
      if (isEdit && id) {
        await mutations.update.mutateAsync({
          id,
          name: form.name,
          description: form.description,
          size,
        });
        if (pricesChanged) {
          await priceMutations.upsertPackages.mutateAsync({
            unitTypeId: id,
            monthlyPrice,
            dailyPrice,
          });
        }
        invalidateUnitType();
        showApiSuccess(t("updated"));
      } else {
        if (!form.propertyId) {
          setFormError(t("selectProperty"));
          return;
        }
        if (!form.description.trim()) {
          setFormError(t("descriptionRequired"));
          return;
        }
        const created = await mutations.create.mutateAsync({
          name: form.name,
          propertyId: form.propertyId,
          description: form.description.trim(),
          size,
        });
        await priceMutations.upsertPackages.mutateAsync({
          unitTypeId: created.id,
          monthlyPrice,
          dailyPrice,
        });
        writeStoredPropertyId(form.propertyId);
        // Files picked before saving upload on the edit page.
        const files = queue.takeAll();
        stashPendingUploads(`unitType:${created.id}`, files);
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
      await deleteUnitTypeAttachment(attachmentId);
      showApiSuccess(ta("deleted"));
      invalidateUnitType();
    } catch (err) {
      showApiError(err, ta("deleteFailed"));
      throw err;
    }
  }

  const pending =
    mutations.create.isPending ||
    mutations.update.isPending ||
    priceMutations.upsertPackages.isPending ||
    (isEdit && isLoading);

  if (isEdit && isLoading && !unitType) {
    return <p className="text-sm text-fg-muted">{t("loading")}</p>;
  }

  const photoCount = attachments.length;

  return (
    <AdminDetailPage
      section={tp("title")}
      mode={isEdit ? "edit" : "create"}
      backHref={BASE}
      backLabel={t("backToList")}
      title={isEdit ? unitType?.name || t("editTitle") : tq("addUnitType")}
      description={isEdit ? tp("editDescription") : tp("formDescription")}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <AdminFormError message={formError} />

          <AdminFormSection
            icon={adminPageIcons.unitTypes}
            title={tp("identityTitle")}
            hint={tp("identityHint")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label={t("property")} htmlFor="ut-property" required>
                <AdminSelect
                  id="ut-property"
                  required
                  disabled={isEdit}
                  value={form.propertyId}
                  onChange={(e) => {
                    const propertyId = e.target.value;
                    setForm((f) => ({ ...f, propertyId }));
                    if (propertyId) writeStoredPropertyId(propertyId);
                  }}
                >
                  <option value="">{t("selectProperty")}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              <AdminField label={t("name")} htmlFor="ut-name" required>
                <input
                  id="ut-name"
                  required
                  className={adminInputClassName}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </AdminField>
              <AdminField
                label={t("description")}
                htmlFor="ut-desc"
                required
                className="sm:col-span-2"
              >
                <AdminTextarea
                  id="ut-desc"
                  required
                  placeholder={tp("descriptionPlaceholder")}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
                <p className="mt-1 text-xs text-fg-muted">
                  {tp("descriptionHint")}
                </p>
              </AdminField>
              <AdminField label={t("size")} htmlFor="ut-size">
                <input
                  id="ut-size"
                  type="number"
                  min={0}
                  className={adminInputClassName}
                  value={form.size}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, size: e.target.value }))
                  }
                />
              </AdminField>
            </div>
          </AdminFormSection>

          <AdminFormSection
            icon="payments"
            title={tpr("pricesTitle")}
            hint={tpr("pricesHint")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label={tpr("monthlyPrice")}
                htmlFor="ut-monthly"
                required
              >
                <AdminCurrencyInput
                  id="ut-monthly"
                  required
                  value={form.monthlyPrice}
                  onValueChange={(monthlyPrice) =>
                    setForm((f) => ({ ...f, monthlyPrice }))
                  }
                />
                <p className="mt-1 text-xs text-fg-muted">
                  {tpr("monthlyPriceHint")}
                </p>
              </AdminField>
              <AdminField label={tpr("dailyPrice")} htmlFor="ut-daily" required>
                <AdminCurrencyInput
                  id="ut-daily"
                  required
                  value={form.dailyPrice}
                  onValueChange={(dailyPrice) =>
                    setForm((f) => ({ ...f, dailyPrice }))
                  }
                />
                <p className="mt-1 text-xs text-fg-muted">
                  {tpr("dailyPriceHint")}
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
          className={cn("space-y-4 lg:sticky lg:top-4", "max-lg:order-first")}
        >
          <UnitTypePreview
            name={form.name}
            description={form.description}
            size={form.size}
            propertyName={
              properties.find((p) => p.id === form.propertyId)?.name
            }
            photo={firstPhoto(attachments)}
            monthly={parseIdrInput(form.monthlyPrice) || null}
          />
          <AdminFormSection
            icon="photo_library"
            title={tp("photosTitle")}
            hint={isEdit ? tp("photosHint") : tp("photosHintCreate")}
            headerExtra={
              isEdit && photoCount > 0 ? (
                <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-fg-2">
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
