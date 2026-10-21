"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  AdminDateRangePicker,
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
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  useLease,
  useLeaseMutations,
  useLeases,
  useUnit,
  useUnitPricings,
} from "@/features/admin/hooks/use-admin-queries";
import { useAttachmentQueue } from "@/features/admin/hooks/use-attachment-queue";
import { useLeaveGuard } from "@/features/admin/hooks/use-leave-guard";
import { LeaseAmountReceipt } from "@/features/admin/leases/lease-amount-receipt";
import { LeaseBillingChoice } from "@/features/admin/leases/lease-billing-choice";
import { LeaseBillingPanel } from "@/features/admin/leases/lease-billing-panel";
import {
  emptyLeaseDiscount,
  LeaseDiscountField,
  type LeaseDiscountFormState,
  leaseDiscountError,
  leaseDiscountFromForm,
} from "@/features/admin/leases/lease-discount-field";
import { createLeaseFormSchema } from "@/features/admin/leases/lease-form.schema";
import { LeaseInvoiceDownloadButton } from "@/features/admin/leases/lease-invoice-download-button";
import {
  findLeaseOverlapConflicts,
  type LeaseOverlapConflict,
} from "@/features/admin/leases/lease-overlap";
import { AdminLeaseRenewalActions } from "@/features/admin/leases/lease-renewal-actions";
import {
  getLeaseEndDateValue,
  resolveLeasePropertyName,
  resolvePricingUnitTypeName,
  resolveUnitPropertyName,
} from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  formatDate,
  formatIdrInput,
  formatIdrTable,
  toDateInputValue,
} from "@/features/admin/lib/format";
import { stashPendingUploads } from "@/features/admin/lib/pending-uploads";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { UnitCombobox } from "@/features/admin/units/unit-combobox";
import { TenantCombobox } from "@/features/admin/users/tenant-combobox";
import { useRouter } from "@/i18n/routing";
import {
  deleteLeaseAttachment,
  updateLeaseAttachmentKind,
  uploadLeaseAttachment,
} from "@/lib/api/admin/attachments";
import {
  applyLeaseDiscount,
  type BillingCycle,
  computeLeaseAmount,
  DAILY_DURATION_DAYS,
  daysInMonth,
  endOfMonth,
  type FirstPeriodMode,
  inclusiveMonthCount,
  MONTHLY_DURATION_DAYS,
  previewInvoiceSchedule,
  toMonthEndInputValue,
} from "@/lib/billing";
import { parseDateOnly, toDateOnlyString } from "@/lib/date-input";
import { contactSummary } from "@/lib/phone";
import { adminKeys } from "@/lib/query/keys";
import type { LeaseAttachmentKind } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const BASE = "/admin/leases";
const DURATION_PRESETS = [1, 3, 6, 12] as const;

type FormState = {
  unitId: string;
  userId: string;
  startDate: string;
  endDate: string;
  unitPricingId: string;
  leaseRenewalId: string;
  allowPaidOverride: boolean;
  billingCycle: BillingCycle;
  firstPeriodMode: FirstPeriodMode;
} & LeaseDiscountFormState;

const emptyForm: FormState = {
  unitId: "",
  userId: "",
  startDate: "",
  endDate: "",
  unitPricingId: "",
  leaseRenewalId: "",
  allowPaidOverride: false,
  billingCycle: "monthly",
  firstPeriodMode: "separate",
  ...emptyLeaseDiscount,
};

function applyLeaseDateRange(
  prev: FormState,
  from: string,
  to: string,
): FormState {
  if (!from) {
    return { ...prev, startDate: "", endDate: "" };
  }
  const endDate = to ? toMonthEndInputValue(to) : "";
  return { ...prev, startDate: from, endDate };
}

/** End date = last day of the calendar month that completes `months` inclusive months from start. */
function endDateForMonthPreset(startDate: string, months: number): string {
  const start = parseDateOnly(startDate);
  if (!start || months < 1) return "";
  return toDateOnlyString(
    endOfMonth(new Date(start.getFullYear(), start.getMonth() + months - 1, 1)),
  );
}

export function LeaseForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tq = useTranslations("admin.mobile.actions");
  const tp = useTranslations("admin.pages.leases");
  const td = useTranslations("admin.pages.leases.discount");
  const tr = useTranslations("admin.pages.leaseRenewals");
  const ta = useTranslations("admin.attachments");
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const isEdit = !!id;
  const { data: pricings = [] } = useUnitPricings();
  const { data: lease, isLoading } = useLease(id ?? "", isEdit);
  const mutations = useLeaseMutations();
  const lookups = useAdminLookups();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const attachments = lease?.attachments ?? lease?.downpaymentAttachments ?? [];

  // Agreement, down-payment proof or rent receipt (reusable on bills).
  const queue = useAttachmentQueue({
    upload: id
      ? (file, kind) =>
          uploadLeaseAttachment(
            id,
            file,
            (kind as LeaseAttachmentKind | undefined) ?? "agreement",
          )
      : null,
    handoffKey: id ? `lease:${id}` : undefined,
    // The admin picks each file's type; nothing is guessed from the name.
    requireKind: true,
    onSettled: ({ succeeded, failed, firstError }) => {
      if (succeeded > 0) {
        invalidateLease();
        showApiSuccess(ta("uploadedCount", { count: succeeded }));
      }
      if (failed > 0) {
        showApiError(firstError, ta("uploadFailedCount", { count: failed }));
      }
    },
  });
  useLeaveGuard(queue.hasUnsent, ta("leaveWarning"));

  const renewalPrefill = useMemo(() => {
    if (isEdit) return null;
    const renewalId = searchParams.get("renewalId");
    const unitId = searchParams.get("unitId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    if (!renewalId || !unitId || !userId) return null;
    return { renewalId, unitId, userId, startDate: startDate ?? "" };
  }, [isEdit, searchParams]);

  const unitPrefill = useMemo(() => {
    if (isEdit || renewalPrefill) return null;
    const unitId = searchParams.get("unitId");
    if (!unitId) return null;
    return {
      unitId,
      startDate: searchParams.get("startDate") ?? "",
    };
  }, [isEdit, renewalPrefill, searchParams]);

  const { data: selectedUnit } = useUnit(form.unitId, !!form.unitId);

  const overlapUnitId = isEdit ? lease?.unitId : form.unitId;
  const overlapUserId = isEdit ? lease?.userId : form.userId;

  const { data: unitLeases = [] } = useLeases(
    overlapUnitId ? { unitId: overlapUnitId } : undefined,
    { enabled: !!overlapUnitId },
  );
  const { data: tenantLeases = [] } = useLeases(
    overlapUserId ? { userId: overlapUserId } : undefined,
    { enabled: !!overlapUserId },
  );

  const selectedPricing = useMemo(
    () => pricings.find((p) => p.id === form.unitPricingId),
    [pricings, form.unitPricingId],
  );

  const dailyPricing = useMemo(() => {
    const unitTypeId =
      selectedUnit?.unitTypeId ??
      selectedPricing?.unitTypeId ??
      lease?.unit?.unitTypeId;
    if (!unitTypeId) return null;
    return (
      pricings.find(
        (p) =>
          p.unitTypeId === unitTypeId && p.durationDays === DAILY_DURATION_DAYS,
      ) ?? null
    );
  }, [pricings, selectedUnit, selectedPricing, lease]);

  const needsDailyPricing = useMemo(() => {
    const start = form.startDate ? parseDateOnly(form.startDate) : null;
    const end = form.endDate ? parseDateOnly(form.endDate) : null;
    const midMonthStart = start != null && start.getDate() !== 1;
    const midMonthEnd = end != null && end.getDate() !== daysInMonth(end);
    return midMonthStart || midMonthEnd;
  }, [form.startDate, form.endDate]);

  const amountPreview = useMemo(() => {
    if (!form.startDate || !form.endDate || !selectedPricing) return null;
    const start = parseDateOnly(form.startDate);
    const end = parseDateOnly(form.endDate);
    if (!start || !end) return null;
    try {
      return computeLeaseAmount(
        start,
        end,
        selectedPricing.price,
        dailyPricing?.price ?? null,
      );
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unable to preview amount",
      } as const;
    }
  }, [form.startDate, form.endDate, selectedPricing, dailyPricing]);

  const amountPreviewDetails =
    amountPreview && !("error" in amountPreview) && selectedPricing
      ? {
          monthlyRate: selectedPricing.price,
          dailyRate: amountPreview.dailyRate,
          startStubSubtotal: amountPreview.stubDays * amountPreview.dailyRate,
          endStubSubtotal: amountPreview.endStubDays * amountPreview.dailyRate,
          monthlySubtotal: amountPreview.fullMonths * selectedPricing.price,
        }
      : null;

  const { discountType, discountAmount, discountPercent } = form;
  const discount = useMemo(
    () =>
      leaseDiscountFromForm({
        discountType,
        discountAmount,
        discountPercent,
        discountNote: "",
      }),
    [discountType, discountAmount, discountPercent],
  );
  /** Rupiah the discount takes off the whole lease (preview). */
  const discountOff = useMemo(() => {
    if (!discount.type || !selectedPricing) return null;
    const start = parseDateOnly(form.startDate);
    const end = parseDateOnly(form.endDate);
    if (!start || !end) return null;
    try {
      return applyLeaseDiscount(
        previewInvoiceSchedule({
          startDate: start,
          endDate: end,
          monthlyPrice: selectedPricing.price,
          dailyRate: dailyPricing?.price ?? null,
          billingCycle: form.billingCycle,
          firstPeriodMode: form.firstPeriodMode,
          paymentDueDay: 1,
        }),
        discount,
      ).reduce((sum, row) => sum + (row.discount ?? 0), 0);
    } catch {
      return null;
    }
  }, [
    discount,
    form.startDate,
    form.endDate,
    form.billingCycle,
    form.firstPeriodMode,
    selectedPricing,
    dailyPricing,
  ]);

  const overlapConflicts = useMemo(() => {
    if (!form.startDate || !form.endDate || !overlapUnitId || !overlapUserId) {
      return [];
    }

    return findLeaseOverlapConflicts({
      startDate: form.startDate,
      endDate: form.endDate,
      unitId: overlapUnitId,
      userId: overlapUserId,
      unitLeases,
      tenantLeases,
      excludeLeaseIds: id ? [id] : [],
      excludeRenewalId: form.leaseRenewalId || undefined,
    });
  }, [
    form.startDate,
    form.endDate,
    form.leaseRenewalId,
    overlapUnitId,
    overlapUserId,
    unitLeases,
    tenantLeases,
    id,
  ]);

  const pricingOptions = useMemo(() => {
    const monthly = pricings.filter(
      (p) => p.durationDays === MONTHLY_DURATION_DAYS,
    );
    if (!selectedUnit) return monthly;
    return monthly.filter((p) => p.unitTypeId === selectedUnit.unitTypeId);
  }, [pricings, selectedUnit]);

  const selectablePricings = useMemo(() => {
    const monthly = pricings.filter(
      (p) => p.durationDays === MONTHLY_DURATION_DAYS,
    );
    if (!isEdit) {
      if (!form.unitId) return [];
      return pricingOptions;
    }
    const unitTypeId = selectedUnit?.unitTypeId ?? lease?.unit?.unitTypeId;
    if (!unitTypeId) return monthly;
    const forType = monthly.filter((p) => p.unitTypeId === unitTypeId);
    if (
      form.unitPricingId &&
      !forType.some((p) => p.id === form.unitPricingId)
    ) {
      const current = monthly.find((p) => p.id === form.unitPricingId);
      if (current) return [...forType, current];
    }
    return forType;
  }, [
    isEdit,
    pricings,
    form.unitId,
    form.unitPricingId,
    pricingOptions,
    selectedUnit?.unitTypeId,
    lease?.unit?.unitTypeId,
  ]);

  const pricingLocked =
    isEdit && lease?.status === "paid" && !form.allowPaidOverride;

  useEffect(() => {
    if (isEdit || form.unitPricingId || selectablePricings.length !== 1) return;
    const only = selectablePricings[0];
    if (!only) return;
    setForm((f) =>
      f.unitPricingId === only.id ? f : { ...f, unitPricingId: only.id },
    );
  }, [isEdit, form.unitPricingId, selectablePricings]);

  useEffect(() => {
    if (lease) {
      setForm({
        unitId: lease.unitId,
        userId: lease.userId,
        startDate: toDateInputValue(lease.startDate),
        endDate: toDateInputValue(lease.endDate),
        unitPricingId: lease.unitPricingId,
        leaseRenewalId: "",
        allowPaidOverride: false,
        billingCycle: lease.billingCycle ?? "upfront",
        firstPeriodMode: lease.firstPeriodMode ?? "separate",
        discountType: lease.discountType ?? "",
        discountAmount:
          lease.discountType === "amount"
            ? formatIdrInput(lease.discountValue ?? 0)
            : "",
        discountPercent:
          lease.discountType === "percent"
            ? String(lease.discountValue ?? "")
            : "",
        discountNote: lease.discountNote ?? "",
      });
    } else if (!isEdit) {
      const startDate =
        renewalPrefill?.startDate ||
        unitPrefill?.startDate ||
        toDateInputValue(new Date());
      setForm((f) => ({
        ...f,
        startDate,
        endDate: toMonthEndInputValue(startDate),
        unitId: renewalPrefill?.unitId ?? unitPrefill?.unitId ?? f.unitId,
        userId: renewalPrefill?.userId ?? f.userId,
        leaseRenewalId: renewalPrefill?.renewalId ?? "",
      }));
    }
  }, [lease, isEdit, renewalPrefill, unitPrefill]);

  function invalidateLease() {
    void qc.invalidateQueries({ queryKey: adminKeys.leases.all() });
    if (id) {
      void qc.invalidateQueries({ queryKey: adminKeys.leases.detail(id) });
    }
  }

  async function handleAttachmentKindChange(
    attachmentId: string,
    kind: string,
  ) {
    try {
      await updateLeaseAttachmentKind(
        attachmentId,
        kind as LeaseAttachmentKind,
      );
      showApiSuccess(ta("kindUpdated"));
      invalidateLease();
    } catch (err) {
      showApiError(err, ta("kindUpdateFailed"));
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    try {
      await deleteLeaseAttachment(attachmentId);
      showApiSuccess(ta("deleted"));
      invalidateLease();
    } catch (err) {
      showApiError(err, ta("deleteFailed"));
      throw err;
    }
  }

  function formatOverlapMessage(conflict: LeaseOverlapConflict): string {
    const { lease } = conflict;
    const endDate = getLeaseEndDateValue(lease);
    const start = formatDate(lease.startDate, locale);
    const end = endDate ? formatDate(endDate, locale) : "—";

    if (conflict.kind === "unit") {
      return tp("overlapUnit", { start, end });
    }

    return tp("overlapTenant", {
      unit: lease.unit?.name ?? lease.unitId,
      property: resolveLeasePropertyName(lease, lookups),
      start,
      end,
    });
  }

  function attachmentKindLabel(kind: LeaseAttachmentKind): string {
    if (kind === "agreement") return tp("kindAgreement");
    if (kind === "payment") return tp("kindPayment");
    return tp("kindDownpayment");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    let createdLeaseId: string | null = null;

    if (queue.needsKind) {
      setFormError(ta("kindRequired"));
      return;
    }

    if (!isEdit) {
      const parsed = createLeaseFormSchema({
        unit: t("selectUnit"),
        tenant: t("selectTenant"),
        startDate: t("pickDate"),
        endDate: t("pickDate"),
        pricing: t("selectPricing"),
      }).safeParse(form);

      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? t("saveFailed");
        setFormError(msg);
        return;
      }
    }

    const discountProblem = leaseDiscountError(form);
    if (discountProblem) {
      setFormError(td(discountProblem));
      return;
    }

    if (overlapConflicts.length > 0) {
      setFormError(formatOverlapMessage(overlapConflicts[0]!));
      return;
    }

    try {
      if (isEdit && id) {
        await mutations.update.mutateAsync({
          id,
          startDate: form.startDate,
          endDate: form.endDate,
          unitPricingId: form.unitPricingId || undefined,
          allowPaidOverride:
            lease?.status === "paid" ? form.allowPaidOverride : undefined,
          discountType: discount.type,
          discountValue: discount.value,
          discountNote: discount.type ? form.discountNote.trim() || null : null,
        });
        invalidateLease();
        showApiSuccess(t("updated"));
      } else {
        const savedLease = await mutations.create.mutateAsync({
          unitId: form.unitId,
          userId: form.userId,
          startDate: form.startDate,
          endDate: form.endDate,
          unitPricingId: form.unitPricingId,
          leaseRenewalId: form.leaseRenewalId || undefined,
          billingCycle: form.billingCycle,
          firstPeriodMode: form.firstPeriodMode,
          discountType: discount.type ?? undefined,
          discountValue: discount.type ? discount.value : undefined,
          discountNote: discount.type
            ? form.discountNote.trim() || undefined
            : undefined,
        });
        createdLeaseId = savedLease.id;
        // Files picked before saving upload on the lease page.
        const files = queue.takeAll();
        stashPendingUploads(`lease:${savedLease.id}`, files);
        showApiSuccess(
          files.length > 0
            ? ta("savedUploading", { count: files.length })
            : form.leaseRenewalId
              ? t("created")
              : tp("createdStayToUpload"),
        );
        if (form.leaseRenewalId && files.length === 0) {
          router.push("/admin/lease-renewals");
        } else {
          router.replace(`${BASE}/${savedLease.id}/edit`);
        }
        router.refresh();
      }
    } catch (err) {
      const msg = getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, t("saveFailed"));
      if (!isEdit && createdLeaseId) {
        router.push(`/admin/leases/${createdLeaseId}/edit`);
        router.refresh();
      }
    }
  }

  const pending =
    mutations.create.isPending ||
    mutations.update.isPending ||
    (isEdit && isLoading);

  if (isEdit && isLoading && !lease) {
    return <p className="text-sm text-fg-muted">{t("loading")}</p>;
  }

  return (
    <AdminDetailPage
      section={tp("title")}
      mode={isEdit ? "edit" : "create"}
      backHref={form.leaseRenewalId ? "/admin/lease-renewals" : BASE}
      backLabel={t("backToList")}
      title={
        isEdit && lease
          ? [lease.unit?.name, lease.user?.name].filter(Boolean).join(" · ") ||
            t("editTitle")
          : tq("newLease")
      }
      description={isEdit ? tp("editDescription") : tp("formDescription")}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
        <div className="min-w-0 space-y-6">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            <AdminFormError message={formError} />
            {!isEdit && renewalPrefill && (
              <div className="rounded-2xl border border-brand-line bg-brand-tint px-4 py-3 text-sm text-fg-2">
                {tr("renewalFormHint")}
              </div>
            )}
            {!isEdit && unitPrefill && selectedUnit && (
              <div className="rounded-2xl border border-success-soft bg-success-soft px-4 py-3 text-sm text-fg-2">
                {tp("unitPrefillHint", {
                  unit: selectedUnit.name,
                  property: resolveUnitPropertyName(selectedUnit, lookups),
                })}
              </div>
            )}
            {!isEdit && (
              <AdminFormSection
                icon={adminPageIcons.users}
                title={tp("partiesTitle")}
                hint={tp("partiesHint")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label={t("unit")} htmlFor="lease-unit" required>
                    <UnitCombobox
                      id="lease-unit"
                      required
                      value={form.unitId}
                      disabled={!!renewalPrefill || !!unitPrefill}
                      onChange={(unitId) =>
                        setForm((f) => ({
                          ...f,
                          unitId,
                          unitPricingId: "",
                        }))
                      }
                    />
                  </AdminField>
                  <AdminField label={t("tenant")} htmlFor="lease-user" required>
                    <TenantCombobox
                      id="lease-user"
                      required
                      value={form.userId}
                      disabled={!!renewalPrefill}
                      onChange={(userId) => setForm((f) => ({ ...f, userId }))}
                    />
                  </AdminField>
                </div>
              </AdminFormSection>
            )}
            <AdminFormSection
              icon="calendar_month"
              title={tp("termsTitle")}
              hint={tp("termsHint")}
            >
              <div className="space-y-4">
                <AdminField
                  label={tp("leasePeriod")}
                  htmlFor="lease-period"
                  required
                >
                  <div className="space-y-3">
                    <AdminDateRangePicker
                      id="lease-period"
                      variant="split"
                      from={form.startDate}
                      to={form.endDate}
                      numberOfMonths={2}
                      placeholder={tp("leasePeriodPlaceholder")}
                      fromLabel={tp("periodStart")}
                      toLabel={tp("periodEnd")}
                      fromHint={tp("periodStartHint")}
                      toHint={tp("periodEndHint")}
                      disabled={
                        isEdit &&
                        lease?.status === "paid" &&
                        !form.allowPaidOverride
                      }
                      onChange={({ from, to }) =>
                        setForm((f) => applyLeaseDateRange(f, from, to))
                      }
                    />

                    {!isEdit ||
                    !(lease?.status === "paid" && !form.allowPaidOverride) ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-fg-muted">
                          {tp("durationPresets")}
                        </span>
                        {DURATION_PRESETS.map((months) => {
                          const start = parseDateOnly(form.startDate);
                          const end = parseDateOnly(form.endDate);
                          const active =
                            !!start &&
                            !!end &&
                            inclusiveMonthCount(start, end) === months;
                          return (
                            <button
                              key={months}
                              type="button"
                              disabled={!form.startDate}
                              onClick={() => {
                                if (!form.startDate) return;
                                setForm((f) => ({
                                  ...f,
                                  endDate: endDateForMonthPreset(
                                    f.startDate,
                                    months,
                                  ),
                                }));
                              }}
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                                active
                                  ? "bg-brand text-white shadow-sm"
                                  : "border border-line bg-white text-fg-2 hover:border-brand-line hover:bg-subtle",
                                "disabled:cursor-not-allowed disabled:opacity-40",
                              )}
                            >
                              {tp("durationMonths", { count: months })}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    <p className="text-xs leading-relaxed text-fg-muted">
                      {tp("leasePeriodHint")}
                    </p>
                  </div>
                </AdminField>
                <AdminField label={t("pricing")} required={!isEdit}>
                  <div className="space-y-2">
                    {!isEdit && !form.unitId ? (
                      <p className="rounded-2xl border border-dashed border-line bg-subtle/80 px-4 py-3 text-sm text-fg-muted">
                        {tp("selectUnitFirstForPricing")}
                      </p>
                    ) : selectablePricings.length === 0 ? (
                      <p className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
                        {tp("noPricingForUnit")}
                      </p>
                    ) : (
                      <div
                        role="radiogroup"
                        aria-label={t("pricing")}
                        className="grid gap-2"
                      >
                        {selectablePricings.map((p) => {
                          const selected = form.unitPricingId === p.id;
                          const packageDaily =
                            pricings.find(
                              (row) =>
                                row.unitTypeId === p.unitTypeId &&
                                row.durationDays === DAILY_DURATION_DAYS,
                            ) ?? null;
                          return (
                            <label
                              key={p.id}
                              className={cn(
                                "relative flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition-all",
                                selected
                                  ? "border-brand/45 bg-gradient-to-br from-panel to-subtle shadow-[0_8px_20px_-16px_rgba(11,11,13,0.35)]"
                                  : "border-line bg-white hover:border-line-strong hover:bg-subtle",
                                pricingLocked &&
                                  "cursor-not-allowed opacity-60",
                              )}
                            >
                              <input
                                type="radio"
                                name="lease-pricing"
                                value={p.id}
                                checked={selected}
                                disabled={pricingLocked}
                                required={!isEdit}
                                onChange={() =>
                                  setForm((f) => ({
                                    ...f,
                                    unitPricingId: p.id,
                                  }))
                                }
                                className="sr-only"
                              />
                              <span
                                aria-hidden
                                className={cn(
                                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                                  selected
                                    ? "border-brand bg-brand"
                                    : "border-line-strong bg-white",
                                )}
                              >
                                {selected ? (
                                  <span className="size-1.5 rounded-full bg-white" />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                  <span className="text-sm font-semibold text-fg">
                                    {resolvePricingUnitTypeName(p, lookups)}
                                  </span>
                                  <span className="text-sm font-semibold tabular-nums text-brand">
                                    {formatIdrTable(p.price)}
                                    <span className="ml-1 text-xs font-medium text-fg-muted">
                                      / {tp("monthlyPackage")}
                                    </span>
                                  </span>
                                </span>
                                <span className="mt-1 block text-xs text-fg-muted">
                                  {packageDaily
                                    ? tp("pricingDailyRate", {
                                        amount: formatIdrTable(
                                          packageDaily.price,
                                        ),
                                      })
                                    : tp("pricingDailyMissing")}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {!isEdit &&
                      selectedUnit &&
                      pricingOptions.length > 0 &&
                      !dailyPricing &&
                      needsDailyPricing && (
                        <p className="text-xs text-danger">
                          {tp("needDailyPricing")}
                        </p>
                      )}
                  </div>
                </AdminField>
                <LeaseDiscountField
                  value={form}
                  onChange={(next) => setForm((f) => ({ ...f, ...next }))}
                  totalOff={discountOff}
                  repricesUnpaidOnly={isEdit}
                />
                {!isEdit && (
                  <LeaseBillingChoice
                    discount={discount}
                    billingCycle={form.billingCycle}
                    firstPeriodMode={form.firstPeriodMode}
                    onChange={(next) => setForm((f) => ({ ...f, ...next }))}
                    startDate={form.startDate}
                    endDate={form.endDate}
                    monthlyPrice={selectedPricing?.price}
                    dailyRate={dailyPricing?.price ?? null}
                    paymentDueDay={
                      (selectedUnit &&
                        lookups.propertyById.get(selectedUnit.propertyId)
                          ?.paymentDueDay) ||
                      5
                    }
                  />
                )}
                {amountPreview && "error" in amountPreview ? (
                  <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
                    {amountPreview.error}
                  </div>
                ) : amountPreview && amountPreviewDetails ? (
                  <LeaseAmountReceipt
                    breakdown={amountPreview}
                    details={amountPreviewDetails}
                    discount={discountOff ?? 0}
                    discountNote={form.discountNote.trim() || null}
                    startDate={form.startDate}
                    endDate={form.endDate}
                    unitLabel={selectedUnit?.name ?? lease?.unit?.name ?? null}
                    propertyLabel={
                      selectedUnit
                        ? resolveUnitPropertyName(selectedUnit, lookups)
                        : lease?.unit
                          ? resolveLeasePropertyName(lease, lookups)
                          : null
                    }
                    headerAction={
                      isEdit && lease ? (
                        <LeaseInvoiceDownloadButton
                          lease={lease}
                          variant="secondary"
                        />
                      ) : null
                    }
                  />
                ) : null}
                {overlapConflicts.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-fg-2">
                    {overlapConflicts.map((conflict) => (
                      <p key={`${conflict.kind}-${conflict.lease.id}`}>
                        {formatOverlapMessage(conflict)}
                      </p>
                    ))}
                  </div>
                )}
                {isEdit && lease?.user && (
                  <AdminField
                    label={t("tenant")}
                    htmlFor="lease-tenant-readonly"
                  >
                    <div
                      id="lease-tenant-readonly"
                      className="rounded-xl border border-line bg-subtle px-4 py-2.5"
                    >
                      <p className="truncate text-sm font-medium text-fg">
                        {lease.user.name}
                      </p>
                      {contactSummary(lease.user) ? (
                        <p className="truncate text-xs text-fg-muted">
                          {contactSummary(lease.user)}
                        </p>
                      ) : null}
                    </div>
                  </AdminField>
                )}
                {isEdit && lease && (
                  <div className="rounded-xl border border-line-strong/55 bg-gradient-to-br from-panel via-subtle to-brand-tint p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_8px_20px_-8px_rgb(122_22_48/0.6)]">
                          <Icon name="picture_as_pdf" size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-fg">
                            {tp("invoice.sectionTitle")}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                            {tp("invoice.sectionHint")}
                          </p>
                        </div>
                      </div>
                      <LeaseInvoiceDownloadButton lease={lease} />
                    </div>
                  </div>
                )}
                {isEdit && lease?.status === "paid" && (
                  <label className="flex items-start gap-2 text-sm text-fg-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.allowPaidOverride}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          allowPaidOverride: e.target.checked,
                        }))
                      }
                    />
                    <span>{tp("allowPaidOverride")}</span>
                  </label>
                )}
                {isEdit && lease?.leaseRenewal && (
                  <AdminLeaseRenewalActions lease={lease} />
                )}
              </div>
            </AdminFormSection>

            <AdminFormActions
              cancelHref={form.leaseRenewalId ? "/admin/lease-renewals" : BASE}
              cancelLabel={t("cancel")}
              pending={pending}
              submitLabel={isEdit ? tp("saveDetails") : tp("saveAndAddPhotos")}
              pendingLabel={t("saving")}
            />
          </form>
          {isEdit && lease ? <LeaseBillingPanel lease={lease} /> : null}
        </div>

        <aside
          className={cn(
            "space-y-4 lg:sticky lg:top-4",
            isEdit && "max-lg:order-first",
          )}
        >
          <AdminFormSection
            icon="attach_file"
            title={tp("photosTitle")}
            hint={isEdit ? tp("photosHint") : tp("photosHintCreate")}
            headerExtra={
              isEdit && attachments.length > 0 ? (
                <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-fg-2">
                  {ta("photoCount", { count: attachments.length })}
                </span>
              ) : null
            }
          >
            <AdminImageGallery
              attachments={attachments.map((item) => ({
                ...item,
                kind: item.kind,
                kindLabel: attachmentKindLabel(item.kind),
                contentType: item.contentType,
              }))}
              queue={queue}
              onDelete={handleDeleteAttachment}
              onKindChange={handleAttachmentKindChange}
              allowPdf
              kindOptions={[
                { value: "agreement", label: tp("kindAgreement") },
                { value: "downpayment", label: tp("kindDownpayment") },
                // Rent receipts; also offered as proof in Record payment.
                { value: "payment", label: tp("kindPayment") },
              ]}
            />
          </AdminFormSection>
        </aside>
      </div>
    </AdminDetailPage>
  );
}
