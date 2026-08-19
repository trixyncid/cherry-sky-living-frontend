"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  AdminCurrencyInput,
  AdminDatePicker,
  AdminField,
  AdminSelect,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormError,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import { AdminImageGallery } from "@/features/admin/components/admin-image-gallery";
import {
  useLedgerEntry,
  useLedgerEntryMutations,
  useProperties,
} from "@/features/admin/hooks/use-admin-queries";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import {
  formatIdrInput,
  parseIdrInput,
  toDateInputValue,
} from "@/features/admin/lib/format";
import {
  deleteLedgerEntryAttachment,
  uploadLedgerEntryImage,
} from "@/lib/api/admin/attachments";
import { adminKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import type { LedgerEntryType } from "@/lib/types/admin";

const BASE = "/admin/bookkeeping";

type FormState = {
  type: LedgerEntryType;
  amount: string;
  description: string;
  date: string;
  propertyId: string;
};

const emptyForm: FormState = {
  type: "income",
  amount: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  propertyId: "",
};

export function LedgerEntryForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.bookkeeping");
  const ta = useTranslations("admin.attachments");
  const router = useRouter();
  const qc = useQueryClient();
  const isEdit = !!id;
  const { data: properties = [] } = useProperties();
  const { data: entry, isLoading } = useLedgerEntry(id ?? "", isEdit);
  const mutations = useLedgerEntryMutations();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const attachments = entry?.attachments ?? [];

  useEffect(() => {
    if (entry) {
      setForm({
        type: entry.type,
        amount: formatIdrInput(entry.amount),
        description: entry.description,
        date: toDateInputValue(entry.date),
        propertyId: entry.propertyId ?? "",
      });
    }
  }, [entry]);

  function invalidateEntry() {
    void qc.invalidateQueries({ queryKey: adminKeys.ledgerEntries.all() });
    if (id) {
      void qc.invalidateQueries({ queryKey: adminKeys.ledgerEntries.detail(id) });
    }
  }

  const isDirty =
    !entry ||
    form.type !== entry.type ||
    parseIdrInput(form.amount) !== entry.amount ||
    form.description !== entry.description ||
    form.date !== toDateInputValue(entry.date) ||
    form.propertyId !== (entry.propertyId ?? "");

  async function handleDeleteAttachment(attachmentId: string) {
    try {
      await deleteLedgerEntryAttachment(attachmentId);
      showApiSuccess(ta("deleted"));
      invalidateEntry();
    } catch (err) {
      showApiError(err, ta("deleteFailed"));
      throw err;
    }
  }

  async function handleImageUpload(files: File[]) {
    if (!isEdit || !id) {
      setImageError(tp("saveFirstToUpload"));
      return;
    }

    setImageError(null);
    const results = await Promise.allSettled(
      files.map((file) => uploadLedgerEntryImage(id, file)),
    );
    const succeeded = results.filter((result) => result.status === "fulfilled");
    const failed = results.filter((result) => result.status === "rejected");

    if (succeeded.length > 0) {
      showApiSuccess(
        succeeded.length === 1
          ? tp("imageUploaded")
          : tp("imagesUploaded", { count: succeeded.length }),
      );
      invalidateEntry();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const amount = parseIdrInput(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError(tp("amountRequired"));
      return;
    }

    const payload = {
      type: form.type,
      amount,
      description: form.description.trim(),
      date: form.date,
      propertyId: form.propertyId || null,
    };

    try {
      if (isEdit && id) {
        await mutations.update.mutateAsync({ id, ...payload });
        invalidateEntry();
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

  const pending =
    mutations.create.isPending ||
    mutations.update.isPending ||
    (isEdit && isLoading);

  if (isEdit && isLoading && !entry) {
    return <p className="text-sm text-[#83746b]">{t("loading")}</p>;
  }

  const photoCount = attachments.length;

  return (
    <AdminDetailPage
      backHref={BASE}
      backLabel={t("backToList")}
      title={isEdit ? entry?.description || t("editTitle") : t("createTitle")}
      description={isEdit ? tp("editDescription") : tp("formDescription")}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-6"
        >
          <AdminFormError message={formError} />

          <AdminFormSection
            icon="receipt_long"
            title={tp("detailsTitle")}
            hint={tp("detailsHint")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label={tp("entryType")} htmlFor="ledger-type" required>
                <AdminSelect
                  id="ledger-type"
                  required
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as LedgerEntryType,
                    }))
                  }
                >
                  <option value="income">{tp("typeIncome")}</option>
                  <option value="expense">{tp("typeExpense")}</option>
                </AdminSelect>
              </AdminField>
              <AdminField label={tp("amount")} htmlFor="ledger-amount" required>
                <AdminCurrencyInput
                  id="ledger-amount"
                  required
                  value={form.amount}
                  onValueChange={(amount) => setForm((f) => ({ ...f, amount }))}
                  placeholder="Rp. 0"
                />
              </AdminField>
              <AdminField
                label={t("description")}
                htmlFor="ledger-description"
                required
                className="sm:col-span-2"
              >
                <input
                  id="ledger-description"
                  required
                  className={adminInputClassName}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </AdminField>
              <AdminField label={tp("date")} htmlFor="ledger-date" required>
                <AdminDatePicker
                  id="ledger-date"
                  value={form.date}
                  onChange={(date) => setForm((f) => ({ ...f, date }))}
                  placeholder={t("pickDate")}
                />
              </AdminField>
              <AdminField label={t("property")} htmlFor="ledger-property">
                <AdminSelect
                  id="ledger-property"
                  value={form.propertyId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, propertyId: e.target.value }))
                  }
                >
                  <option value="">{tp("noProperty")}</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </AdminSelect>
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
