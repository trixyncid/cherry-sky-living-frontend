"use client";

import { useTranslations } from "next-intl";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { AdminSelect } from "@/features/admin/components/admin-field";
import { cn } from "@/lib/utils";

export function PropertyFilter({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (propertyId: string) => void;
  className?: string;
}) {
  const t = useTranslations("admin.crud");
  const { properties } = useAdminShell();

  return (
    <AdminSelect
      className={cn("w-full shrink-0 sm:w-[14rem] sm:max-w-xs", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{t("allProperties")}</option>
      {properties.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </AdminSelect>
  );
}
