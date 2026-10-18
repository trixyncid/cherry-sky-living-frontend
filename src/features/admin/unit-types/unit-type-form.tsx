"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
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
import {
  useUnitType,
  useUnitTypeMutations,
} from "@/features/admin/hooks/use-admin-queries";
import {
  firstPhoto,
  monthlyOf,
  type UnitTypeWithInventory,
} from "@/features/admin/inventory/inventory-kit";
import {
  readStoredPropertyId,
  writeStoredPropertyId,
} from "@/features/admin/lib/admin-property-scope";
import { getErrorMessage } from "@/features/admin/lib/errors";
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
};

const emptyForm: FormState = {
  name: "",
  description: "",
  propertyId: "",
  size: "",
};

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
  const ta = useTranslations("admin.attachments");
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const isEdit = !!id;
  const { properties } = useAdminShell();
  const { data: unitType, isLoading } = useUnitType(id ?? "", isEdit);
  const mutations = useUnitTypeMutations();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const createPrefillDone = useRef(false);

  const attachments = unitType?.unitTypeAttachments ?? [];

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

  const isDirty =
    !unitType ||
    form.name !== unitType.name ||
    form.description !== (unitType.description ?? "") ||
    form.size !== (unitType.size != null ? String(unitType.size) : "");

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

    try {
      if (isEdit && id) {
        await mutations.update.mutateAsync({
          id,
          name: form.name,
          description: form.description,
          size,
        });
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
        writeStoredPropertyId(form.propertyId);
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
      files.map((file) => uploadUnitTypeImage(id, file)),
    );
    const succeeded = results.filter((result) => result.status === "fulfilled");
    const failed = results.filter((result) => result.status === "rejected");

    if (succeeded.length > 0) {
      showApiSuccess(
        succeeded.length === 1
          ? tp("imageUploaded")
          : tp("imagesUploaded", { count: succeeded.length }),
      );
      invalidateUnitType();
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
    (isEdit && isLoading);

  if (isEdit && isLoading && !unitType) {
    return <p className="text-sm text-[#6b6b6b]">{t("loading")}</p>;
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
            icon="king_bed"
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
                <p className="mt-1 text-xs text-[#6b6b6b]">
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
          <UnitTypePreview
            name={form.name}
            description={form.description}
            size={form.size}
            propertyName={
              properties.find((p) => p.id === form.propertyId)?.name
            }
            photo={firstPhoto(attachments)}
            monthly={monthlyOf(
              (unitType as UnitTypeWithInventory | undefined)?.pricings,
            )}
          />
          <AdminFormSection
            icon="photo_library"
            title={tp("photosTitle")}
            hint={isEdit ? tp("photosHint") : tp("photosHintCreate")}
            headerExtra={
              isEdit && photoCount > 0 ? (
                <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#3d3a36]">
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
