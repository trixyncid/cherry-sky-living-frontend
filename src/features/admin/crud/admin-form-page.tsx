"use client";

import { AdminAlert } from "@/features/admin/components/admin-alert";
import {
  AdminDetailPage,
  AdminFormActions,
} from "@/features/admin/components/admin-form-layout";

interface AdminFormPageProps {
  title: string;
  description?: string;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
  error?: string | null;
  onSubmit: (e: React.FormEvent) => void;
  pending?: boolean;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
  cancelLabel: string;
  submitDisabled?: boolean;
}

export function AdminFormPage({
  title,
  description,
  backHref,
  backLabel,
  children,
  error,
  onSubmit,
  pending,
  submitLabel,
  pendingLabel,
  cancelHref,
  cancelLabel,
  submitDisabled,
}: AdminFormPageProps) {
  return (
    <AdminDetailPage
      backHref={backHref}
      backLabel={backLabel}
      title={title}
      description={description}
      wide={false}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {error ? <AdminAlert message={error} /> : null}
        <div className="glass-panel space-y-5 rounded-[1.75rem] p-5 sm:p-6">
          {children}
        </div>
        <AdminFormActions
          cancelHref={cancelHref}
          cancelLabel={cancelLabel}
          pending={pending}
          submitDisabled={submitDisabled}
          submitLabel={submitLabel}
          pendingLabel={pendingLabel}
        />
      </form>
    </AdminDetailPage>
  );
}
