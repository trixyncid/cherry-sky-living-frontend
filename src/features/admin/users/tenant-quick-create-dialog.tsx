"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AdminField,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { useTenantUserMutations } from "@/features/admin/hooks/use-admin-queries";
import {
  createTenantUserSchema,
} from "@/features/admin/users/schemas";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import { ApiError } from "@/lib/api/errors";
import type { TenantUser } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const emptyForm = {
  name: "",
  phoneNumber: "",
  email: "",
  password: "",
};

type TenantQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tenant: TenantUser) => void;
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
};

export function TenantQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
  initialName = "",
  initialEmail = "",
  initialPhone = "",
}: TenantQuickCreateDialogProps) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.users");
  const mutations = useTenantUserMutations();
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: initialName,
        phoneNumber: initialPhone,
        email: initialEmail,
        password: "",
      });
      setFormError(null);
      setShowPassword(false);
    }
  }, [open, initialName, initialEmail, initialPhone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = createTenantUserSchema({
      nameRequired: tp("validation.nameRequired"),
      emailInvalid: tp("validation.emailInvalid"),
      phoneRequired: tp("validation.phoneRequired"),
      phoneInvalid: tp("validation.phoneInvalid"),
      passwordMin: tp("validation.passwordMin"),
    }).safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t("saveFailed"));
      return;
    }

    try {
      const created = await mutations.create.mutateAsync(parsed.data);
      showApiSuccess(t("created"));
      onCreated(created);
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "CONFLICT"
          ? tp("emailExists")
          : getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, msg);
    }
  }

  const pending = mutations.create.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tp("createTitle")}</DialogTitle>
          <DialogDescription>{tp("formDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {formError && (
            <p className="rounded-lg border border-[#ba1a1a]/20 bg-[#fff5f5] px-3 py-2 text-sm text-[#ba1a1a]">
              {formError}
            </p>
          )}

          <AdminField label={t("name")} htmlFor="quick-tenant-name" required>
            <input
              id="quick-tenant-name"
              required
              autoComplete="name"
              className={adminInputClassName}
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </AdminField>

          <AdminField label={tp("phone")} htmlFor="quick-tenant-phone" required>
            <input
              id="quick-tenant-phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder={tp("phonePlaceholder")}
              className={adminInputClassName}
              value={form.phoneNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, phoneNumber: e.target.value }))
              }
            />
          </AdminField>

          <AdminField label={tp("emailOptional")} htmlFor="quick-tenant-email">
            <input
              id="quick-tenant-email"
              type="email"
              autoComplete="email"
              className={adminInputClassName}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </AdminField>

          <AdminField label={tp("password")} htmlFor="quick-tenant-password" required>
            <div className="relative">
              <input
                id="quick-tenant-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                className={cn(adminInputClassName, "pr-10")}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5f5e5e] transition-colors hover:text-[#71130d]"
                aria-label={
                  showPassword ? tp("hidePassword") : tp("showPassword")
                }
              >
                <Icon
                  name={showPassword ? "visibility_off" : "visibility"}
                  size={20}
                />
              </button>
            </div>
            <p className="mt-1 text-xs text-[#83746b]">{tp("passwordHint")}</p>
          </AdminField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
