"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { CountryPhoneInput } from "@/components/shared/country-phone-input";
import { Icon } from "@/components/shared/Icon";
import { RequiredMark } from "@/components/shared/required-mark";
import { adminInputClassName } from "@/features/admin/components/admin-field";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  MAX_PHONES,
  newPhoneRow,
  type PhoneListValue,
  type PhoneRow,
} from "@/lib/phone-list";
import { cn } from "@/lib/utils";

type PhoneNumbersFieldProps = {
  value: PhoneListValue;
  onChange: (value: PhoneListValue) => void;
  /** "admin" talks about "the tenant"; "self" talks to the tenant. */
  audience: "admin" | "self";
  /** Saved login number, to warn when the selection moves away from it. */
  savedLoginPhone?: string | null;
  disabled?: boolean;
};

/**
 * A person's phone numbers. Exactly one is marked as the login number, i.e.
 * what they type on the tenant sign-in page; the rest are contact-only.
 */
export function PhoneNumbersField({
  value,
  onChange,
  audience,
  savedLoginPhone,
  disabled = false,
}: PhoneNumbersFieldProps) {
  const t = useTranslations("common.phoneList");
  const groupName = useId();
  const { rows, loginKey } = value;
  const canAdd = rows.length < MAX_PHONES && !disabled;
  const loginRow = rows.find((r) => r.key === loginKey);

  function update(key: string, patch: Partial<PhoneRow>) {
    onChange({
      ...value,
      rows: rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    });
  }

  function remove(key: string) {
    const next = rows.filter((r) => r.key !== key);
    onChange({
      rows: next,
      // Removing the login row hands login to the first remaining number.
      loginKey: key === loginKey ? (next[0]?.key ?? "") : loginKey,
    });
  }

  function add() {
    const row = newPhoneRow();
    onChange({ ...value, rows: [...rows, row] });
  }

  const loginChanged =
    savedLoginPhone != null &&
    loginRow?.phoneNumber.trim() &&
    formatPhoneDisplay(loginRow.phoneNumber) !==
      formatPhoneDisplay(savedLoginPhone);

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-label-sm text-foreground">
        {t("title")}
        <RequiredMark className="ml-0.5" />
      </legend>
      <p className="-mt-1 text-xs leading-relaxed text-fg-muted">
        {audience === "admin" ? t("hintAdmin") : t("hintSelf")}
      </p>

      <ul className="space-y-2.5">
        {rows.map((row, index) => {
          const isLogin = row.key === loginKey;
          // Position, not row.key: keys come from a module counter that differs
          // between server and browser, which broke hydration.
          const inputId = `${groupName}-phone-${index + 1}`;
          return (
            <li
              key={row.key}
              className={cn(
                "rounded-2xl border p-3 transition-colors",
                isLogin
                  ? "border-brand-line bg-brand-tint/40"
                  : "border-line bg-white",
              )}
            >
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <div>
                  <label htmlFor={inputId} className="sr-only">
                    {t("numberLabel", { n: index + 1 })}
                  </label>
                  <CountryPhoneInput
                    id={inputId}
                    autoComplete={isLogin ? "tel" : "off"}
                    value={row.phoneNumber}
                    onChange={(phoneNumber) => update(row.key, { phoneNumber })}
                  />
                </div>
                <div>
                  <label htmlFor={`${inputId}-label`} className="sr-only">
                    {t("labelLabel", { n: index + 1 })}
                  </label>
                  <input
                    id={`${inputId}-label`}
                    maxLength={40}
                    placeholder={t("labelPlaceholder")}
                    className={adminInputClassName}
                    value={row.label}
                    onChange={(e) => update(row.key, { label: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <label
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
                    isLogin
                      ? "bg-brand text-white"
                      : "bg-subtle text-fg-2 hover:bg-hover",
                  )}
                >
                  <input
                    type="radio"
                    name={groupName}
                    className="sr-only"
                    checked={isLogin}
                    onChange={() => onChange({ ...value, loginKey: row.key })}
                  />
                  <Icon
                    name={isLogin ? "key" : "radio_button_unchecked"}
                    size={16}
                  />
                  {isLogin ? t("loginBadge") : t("useForLogin")}
                </label>

                {rows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => remove(row.key)}
                    aria-label={t("remove", {
                      number:
                        row.phoneNumber || t("numberLabel", { n: index + 1 }),
                    })}
                    title={t("removeShort")}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={add}
          disabled={!canAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3.5 text-sm font-medium text-fg-2 transition-colors hover:border-brand-line hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="add" size={18} />
          {t("add")}
        </button>
        <span className="text-xs text-fg-muted">
          {t("count", { count: rows.length, max: MAX_PHONES })}
        </span>
      </div>

      {loginChanged ? (
        <output className="flex items-start gap-1.5 rounded-lg border border-brand-line bg-brand-tint px-3 py-2 text-xs leading-relaxed text-fg-2">
          <Icon name="info" size={14} className="mt-0.5 shrink-0 text-brand" />
          {audience === "admin"
            ? t("loginChangedAdmin", {
                phone: formatPhoneDisplay(loginRow?.phoneNumber),
              })
            : t("loginChangedSelf", {
                phone: formatPhoneDisplay(loginRow?.phoneNumber),
              })}
        </output>
      ) : null}
    </fieldset>
  );
}
