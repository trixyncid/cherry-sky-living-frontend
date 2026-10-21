"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  AdminCurrencyInput,
  AdminField,
  AdminSelect,
} from "@/features/admin/components/admin-field";
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormError,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { PricingPreview } from "@/features/admin/components/form-previews";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import {
  useUnitPricing,
  useUnitPricingMutations,
  useUnitPricings,
  useUnitTypes,
} from "@/features/admin/hooks/use-admin-queries";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatIdrInput, parseIdrInput } from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { useRouter } from "@/i18n/routing";
import { DAILY_DURATION_DAYS, MONTHLY_DURATION_DAYS } from "@/lib/billing";
import type { UnitPricing } from "@/lib/types/admin";

const BASE = "/admin/pricing";

type FormState = {
  propertyId: string;
  unitTypeId: string;
  monthlyPrice: string;
  dailyPrice: string;
};

const emptyForm: FormState = {
  propertyId: "",
  unitTypeId: "",
  monthlyPrice: "",
  dailyPrice: "",
};

const EMPTY_PRICINGS: UnitPricing[] = [];

function sameForm(a: FormState, b: FormState) {
  return (
    a.propertyId === b.propertyId &&
    a.unitTypeId === b.unitTypeId &&
    a.monthlyPrice === b.monthlyPrice &&
    a.dailyPrice === b.dailyPrice
  );
}

export function PricingForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tq = useTranslations("admin.mobile.actions");
  const tp = useTranslations("admin.pages.pricing");
  const router = useRouter();
  const isEdit = !!id;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const { properties } = useAdminShell();
  const { data: pricing, isLoading } = useUnitPricing(id ?? "", isEdit);
  const unitTypeIdForLoad = pricing?.unitTypeId;
  const siblingUnitTypeId = isEdit
    ? unitTypeIdForLoad
    : form.unitTypeId || undefined;
  const { data: unitTypePricings = EMPTY_PRICINGS, isLoading: siblingLoading } =
    useUnitPricings(
      siblingUnitTypeId ? { unitTypeId: siblingUnitTypeId } : undefined,
    );
  const mutations = useUnitPricingMutations();

  const { data: unitTypes = [] } = useUnitTypes(
    form.propertyId || undefined,
    !!form.propertyId || isEdit,
  );

  const availableUnitTypes = useMemo(() => {
    if (!form.propertyId) return [];
    return unitTypes.filter((ut) => ut.propertyId === form.propertyId);
  }, [unitTypes, form.propertyId]);

  useEffect(() => {
    if (pricing) {
      const monthly =
        unitTypePricings.find(
          (p) => p.durationDays === MONTHLY_DURATION_DAYS,
        ) ?? (pricing.durationDays === MONTHLY_DURATION_DAYS ? pricing : null);
      const daily =
        unitTypePricings.find((p) => p.durationDays === DAILY_DURATION_DAYS) ??
        (pricing.durationDays === DAILY_DURATION_DAYS ? pricing : null);

      const next: FormState = {
        propertyId: pricing.propertyId,
        unitTypeId: pricing.unitTypeId,
        monthlyPrice: monthly ? formatIdrInput(monthly.price) : "",
        dailyPrice: daily ? formatIdrInput(daily.price) : "",
      };
      setForm((prev) => (sameForm(prev, next) ? prev : next));
      return;
    }

    if (!isEdit && form.unitTypeId && unitTypePricings.length > 0) {
      const monthly = unitTypePricings.find(
        (p) => p.durationDays === MONTHLY_DURATION_DAYS,
      );
      const daily = unitTypePricings.find(
        (p) => p.durationDays === DAILY_DURATION_DAYS,
      );
      setForm((f) => {
        const next: FormState = {
          ...f,
          monthlyPrice: monthly
            ? formatIdrInput(monthly.price)
            : f.monthlyPrice,
          dailyPrice: daily ? formatIdrInput(daily.price) : f.dailyPrice,
        };
        return sameForm(f, next) ? f : next;
      });
    }
  }, [pricing, unitTypePricings, isEdit, form.unitTypeId]);

  // "Set price" links prefill the property and room type.
  useEffect(() => {
    if (isEdit) return;
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get("propertyId");
    const unitTypeId = params.get("unitTypeId");
    if (!propertyId) return;
    setForm((f) =>
      f.propertyId ? f : { ...f, propertyId, unitTypeId: unitTypeId ?? "" },
    );
  }, [isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const monthlyPrice = parseIdrInput(form.monthlyPrice);
    const dailyPrice = parseIdrInput(form.dailyPrice);

    if (!form.unitTypeId) {
      setFormError(t("selectUnitType"));
      return;
    }
    if (!Number.isFinite(monthlyPrice) || monthlyPrice <= 0) {
      setFormError(tp("monthlyPriceRequired"));
      return;
    }
    if (!Number.isFinite(dailyPrice) || dailyPrice <= 0) {
      setFormError(tp("dailyPriceRequired"));
      return;
    }

    try {
      await mutations.upsertPackages.mutateAsync({
        unitTypeId: form.unitTypeId,
        monthlyPrice,
        dailyPrice,
      });
      showApiSuccess(isEdit ? t("updated") : t("created"));
      if (!isEdit) {
        router.replace(BASE);
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      const msg = getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, t("saveFailed"));
    }
  }

  const pending =
    mutations.upsertPackages.isPending ||
    (isEdit && (isLoading || siblingLoading));

  if (isEdit && isLoading && !pricing) {
    return <p className="text-sm text-fg-muted">{t("loading")}</p>;
  }

  return (
    <AdminDetailPage
      section={tp("title")}
      mode={isEdit ? "edit" : "create"}
      aside={
        <PricingPreview
          monthly={parseIdrInput(form.monthlyPrice) || 0}
          daily={parseIdrInput(form.dailyPrice) || 0}
          unitTypeName={
            (isEdit ? unitTypes : availableUnitTypes).find(
              (ut) => ut.id === form.unitTypeId,
            )?.name
          }
          propertyName={properties.find((p) => p.id === form.propertyId)?.name}
        />
      }
      backHref={BASE}
      backLabel={t("backToList")}
      title={
        isEdit ? (pricing?.unitType?.name ?? t("editTitle")) : tq("setPricing")
      }
      description={isEdit ? tp("editDescription") : tp("formDescription")}
      wide={false}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <AdminFormError message={formError} />

        <AdminFormSection
          icon={adminPageIcons.properties}
          title={tp("assignmentTitle")}
          hint={tp("assignmentHint")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {!isEdit ? (
              <AdminField
                label={t("property")}
                htmlFor="price-property"
                required
              >
                <AdminSelect
                  id="price-property"
                  required
                  value={form.propertyId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      propertyId: e.target.value,
                      unitTypeId: "",
                    }))
                  }
                >
                  <option value="">{t("selectProperty")}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
            ) : null}

            <AdminField
              label={t("unitType")}
              htmlFor="price-unit-type"
              required
              className={isEdit ? "sm:col-span-2" : undefined}
            >
              <AdminSelect
                id="price-unit-type"
                required
                disabled={isEdit || !form.propertyId}
                value={form.unitTypeId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unitTypeId: e.target.value }))
                }
              >
                <option value="">
                  {!form.propertyId && !isEdit
                    ? t("selectPropertyFirst")
                    : t("selectUnitType")}
                </option>
                {(isEdit ? unitTypes : availableUnitTypes).map((ut) => (
                  <option key={ut.id} value={ut.id}>
                    {ut.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>
        </AdminFormSection>

        <AdminFormSection
          icon="payments"
          title={tp("pricesTitle")}
          hint={tp("pricesHint")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label={tp("monthlyPrice")}
              htmlFor="price-monthly"
              required
            >
              <AdminCurrencyInput
                id="price-monthly"
                required
                value={form.monthlyPrice}
                onValueChange={(monthlyPrice) =>
                  setForm((f) => ({ ...f, monthlyPrice }))
                }
              />
              <p className="mt-1 text-xs text-fg-muted">
                {tp("monthlyPriceHint")}
              </p>
            </AdminField>
            <AdminField label={tp("dailyPrice")} htmlFor="price-daily" required>
              <AdminCurrencyInput
                id="price-daily"
                required
                value={form.dailyPrice}
                onValueChange={(dailyPrice) =>
                  setForm((f) => ({ ...f, dailyPrice }))
                }
              />
              <p className="mt-1 text-xs text-fg-muted">
                {tp("dailyPriceHint")}
              </p>
            </AdminField>
          </div>
        </AdminFormSection>

        <AdminFormActions
          cancelHref={BASE}
          cancelLabel={t("cancel")}
          pending={pending}
          submitLabel={tp("saveDetails")}
          pendingLabel={t("saving")}
        />
      </form>
    </AdminDetailPage>
  );
}
