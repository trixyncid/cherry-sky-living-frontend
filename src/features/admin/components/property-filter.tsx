"use client";

import { useTranslations } from "next-intl";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { AdminSelect } from "@/features/admin/components/admin-field";
import { cn } from "@/lib/utils";

export function PropertyFilter({
  value,
  onChange,
  className,
  /** When true, omit the "All properties" option (property required). */
  requireProperty = false,
  /** Override label for the empty/"All" option (e.g. inventory mode). */
  allLabel,
}: {
  value: string;
  onChange: (propertyId: string) => void;
  className?: string;
  requireProperty?: boolean;
  allLabel?: string;
}) {
  const t = useTranslations("admin.crud");
  const { properties } = useAdminShell();

  return (
    <AdminSelect
      className={cn("w-full shrink-0 sm:w-[14rem] sm:max-w-xs", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {!requireProperty && (
        <option value="">{allLabel ?? t("allProperties")}</option>
      )}
      {requireProperty && !value && (
        <option value="">{t("selectProperty")}</option>
      )}
      {properties.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </AdminSelect>
  );
}
