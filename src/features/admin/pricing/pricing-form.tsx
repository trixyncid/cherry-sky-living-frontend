"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  AdminCurrencyInput,
  AdminField,
  AdminSelect,
} from "@/features/admin/components/admin-field";
import { AdminFormPage } from "@/features/admin/crud/admin-form-page";
import {
  useProperties,
  useUnitPricing,
  useUnitPricingMutations,
  useUnitPricings,
  useUnitTypes,
} from "@/features/admin/hooks/use-admin-queries";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  formatIdrInput,
  parseIdrInput,
} from "@/features/admin/lib/format";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import {
  DAILY_DURATION_DAYS,
  MONTHLY_DURATION_DAYS,
} from "@/lib/billing";

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

export function PricingForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.pricing");
  const router = useRouter();
  const isEdit = !!id;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const { data: properties = [] } = useProperties();
  const { data: pricing, isLoading } = useUnitPricing(id ?? "", isEdit);
  const unitTypeIdForLoad = pricing?.unitTypeId;
  const pricingFilters = isEdit
    ? unitTypeIdForLoad
      ? { unitTypeId: unitTypeIdForLoad }
      : undefined
    : form.unitTypeId
      ? { unitTypeId: form.unitTypeId }
      : undefined;
  const { data: unitTypePricings = [], isLoading: siblingLoading } =
    useUnitPricings(pricingFilters);
  const mutations = useUnitPricingMutations();

  const { data: unitTypes = [] } = useUnitTypes(form.propertyId || undefined);

  const availableUnitTypes = useMemo(() => {
    if (!form.propertyId) return unitTypes;
    return unitTypes.filter((ut) => ut.propertyId === form.propertyId);
  }, [unitTypes, form.propertyId]);

  const monthlyRow = useMemo(
    () =>
      unitTypePricings.find((p) => p.durationDays === MONTHLY_DURATION_DAYS) ??
      null,
    [unitTypePricings],
  );
  const dailyRow = useMemo(
    () =>
      unitTypePricings.find((p) => p.durationDays === DAILY_DURATION_DAYS) ??
      null,
    [unitTypePricings],
  );

  useEffect(() => {
    if (pricing) {
      const monthly =
        unitTypePricings.find((p) => p.durationDays === MONTHLY_DURATION_DAYS) ??
        (pricing.durationDays === MONTHLY_DURATION_DAYS ? pricing : null);
      const daily =
        unitTypePricings.find((p) => p.durationDays === DAILY_DURATION_DAYS) ??
        (pricing.durationDays === DAILY_DURATION_DAYS ? pricing : null);

      setForm({
        propertyId: pricing.propertyId,
        unitTypeId: pricing.unitTypeId,
        monthlyPrice: monthly ? formatIdrInput(monthly.price) : "",
        dailyPrice: daily ? formatIdrInput(daily.price) : "",
      });
      return;
    }

    if (!isEdit && form.unitTypeId && unitTypePricings.length > 0) {
      const monthly = unitTypePricings.find(
        (p) => p.durationDays === MONTHLY_DURATION_DAYS,
      );
      const daily = unitTypePricings.find(
        (p) => p.durationDays === DAILY_DURATION_DAYS,
      );
      setForm((f) => ({
        ...f,
        monthlyPrice: monthly ? formatIdrInput(monthly.price) : f.monthlyPrice,
        dailyPrice: daily ? formatIdrInput(daily.price) : f.dailyPrice,
      }));
    }
  }, [pricing, unitTypePricings, isEdit, form.unitTypeId]);

  async function upsertPackage(
    unitTypeId: string,
    durationDays: number,
    price: number,
    existingId?: string,
  ) {
    if (existingId) {
      await mutations.update.mutateAsync({ id: existingId, price });
      return;
    }
    await mutations.create.mutateAsync({
      unitTypeId,
      durationDays,
      price,
    });
  }

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

    const existingMonthly =
      monthlyRow ??
      unitTypePricings.find((p) => p.durationDays === MONTHLY_DURATION_DAYS);
    const existingDaily =
      dailyRow ??
      unitTypePricings.find((p) => p.durationDays === DAILY_DURATION_DAYS);

    try {
      await upsertPackage(
        form.unitTypeId,
        MONTHLY_DURATION_DAYS,
        monthlyPrice,
        existingMonthly?.id,
      );
      await upsertPackage(
        form.unitTypeId,
        DAILY_DURATION_DAYS,
        dailyPrice,
        existingDaily?.id,
      );
      showApiSuccess(isEdit ? t("updated") : t("created"));
      router.push(BASE);
      router.refresh();
    } catch (err) {
      const msg = getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, t("saveFailed"));
    }
  }

  const pending =
    mutations.create.isPending ||
    mutations.update.isPending ||
    (isEdit && (isLoading || siblingLoading));

  if (isEdit && isLoading && !pricing) {
    return <p className="text-sm text-[#83746b]">{t("loading")}</p>;
  }

  return (
    <AdminFormPage
      title={isEdit ? t("editTitle") : t("createTitle")}
      description={tp("formDescription")}
      backHref={BASE}
      backLabel={t("backToList")}
      error={formError}
      onSubmit={(e) => void handleSubmit(e)}
      pending={pending}
      submitLabel={t("save")}
      pendingLabel={t("saving")}
      cancelHref={BASE}
      cancelLabel={t("cancel")}
    >
      {!isEdit && (
        <AdminField label={t("property")} htmlFor="price-property" required>
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
      )}

      <AdminField label={t("unitType")} htmlFor="price-unit-type" required>
        <AdminSelect
          id="price-unit-type"
          required
          disabled={isEdit}
          value={form.unitTypeId}
          onChange={(e) =>
            setForm((f) => ({ ...f, unitTypeId: e.target.value }))
          }
        >
          <option value="">{t("selectUnitType")}</option>
          {(isEdit ? unitTypes : availableUnitTypes).map((ut) => (
            <option key={ut.id} value={ut.id}>
              {ut.name}
            </option>
          ))}
        </AdminSelect>
      </AdminField>

      <AdminField label={tp("monthlyPrice")} htmlFor="price-monthly" required>
        <AdminCurrencyInput
          id="price-monthly"
          required
          value={form.monthlyPrice}
          onValueChange={(monthlyPrice) =>
            setForm((f) => ({ ...f, monthlyPrice }))
          }
        />
        <p className="mt-1 text-xs text-[#83746b]">{tp("monthlyPriceHint")}</p>
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
        <p className="mt-1 text-xs text-[#83746b]">{tp("dailyPriceHint")}</p>
      </AdminField>
    </AdminFormPage>
  );
}
