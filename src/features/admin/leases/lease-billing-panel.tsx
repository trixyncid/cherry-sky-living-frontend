"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AdminField,
  AdminFileInput,
  AdminSelect,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { AdminFormSection } from "@/features/admin/components/admin-form-layout";
import {
  LeaseBillingBadge,
  LeaseStatusBadge,
} from "@/features/admin/components/status-badge";
import { useLeaseMutations } from "@/features/admin/hooks/use-admin-queries";
import { formatDate, formatIdr } from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import type { Lease, LeaseBillingCycle, LeaseInvoice } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const secondaryBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line-strong bg-panel px-4 text-sm font-medium text-fg transition-colors hover:border-fg hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50";
const primaryBtn =
  "admin-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-50";
const menuItem =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:outline-none";

function isDue(invoice: LeaseInvoice): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(invoice.dueDate) <= today || invoice.daysLate > 0;
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "danger";
}) {
  return (
    <div className="rounded-xl border border-line bg-subtle px-3.5 py-3">
      <p className="text-xs text-fg-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold tabular-nums",
          tone === "danger" ? "text-danger" : "text-fg",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-fg-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * A lease's payment schedule: one row per bill, record payments for one or
 * several bills with one receipt, reject / review, waive late fees and
 * switch between monthly and up-front billing.
 */
export function LeaseBillingPanel({ lease }: { lease: Lease }) {
  const t = useTranslations("admin.pages.leases.billing");
  const td = useTranslations("admin.pages.leases.discount");
  const tc = useTranslations("admin.crud");
  const locale = useLocale();
  const mutations = useLeaseMutations();
  const invoices = lease.invoices ?? [];
  const billing = lease.billing;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [payOpen, setPayOpen] = useState(false);
  const [waiveFor, setWaiveFor] = useState<LeaseInvoice | null>(null);
  const [switchTo, setSwitchTo] = useState<LeaseBillingCycle | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const open = invoices.filter((inv) => inv.status !== "paid");
  const dueOpen = open.filter(isDue);
  const selectedInvoices = invoices.filter((inv) => selected.has(inv.id));
  const selectedTotal = selectedInvoices.reduce((s, inv) => s + inv.amount, 0);
  const cycle = lease.billingCycle ?? "upfront";

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function setPending(
    invoice: LeaseInvoice,
    status: "unpaid" | "waiting_for_review",
  ) {
    setMenuFor(null);
    try {
      await mutations.setInvoicePending.mutateAsync({
        id: lease.id,
        invoiceId: invoice.id,
        status,
      });
      showApiSuccess(t("updated"));
    } catch (err) {
      showApiError(err, tc("saveFailed"));
    }
  }

  async function unwaive(invoice: LeaseInvoice) {
    setMenuFor(null);
    try {
      await mutations.setLateFeeWaiver.mutateAsync({
        id: lease.id,
        invoiceId: invoice.id,
        waived: false,
      });
      showApiSuccess(t("updated"));
    } catch (err) {
      showApiError(err, tc("saveFailed"));
    }
  }

  async function confirmSwitch() {
    if (!switchTo) return;
    try {
      await mutations.updateBilling.mutateAsync({
        id: lease.id,
        billingCycle: switchTo,
      });
      setSelected(new Set());
      setSwitchTo(null);
      showApiSuccess(t("updated"));
    } catch (err) {
      showApiError(err, tc("saveFailed"));
    }
  }

  return (
    <AdminFormSection
      icon="receipt_long"
      title={t("sectionTitle")}
      hint={t("sectionHint")}
      headerExtra={
        billing ? (
          <LeaseBillingBadge
            state={billing.state}
            overdueCount={billing.overdueCount}
          />
        ) : null
      }
    >
      <div className="space-y-5">
        {lease.discountType && lease.discountValue ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-brand-tint px-3.5 py-2.5 text-sm text-fg-2">
            <Icon name="sell" size={16} className="text-brand" />
            <span className="font-medium text-fg">
              {lease.discountType === "percent"
                ? td("summaryPercent", { value: lease.discountValue })
                : td("summaryAmount", {
                    amount: formatIdr(lease.discountValue),
                  })}
            </span>
            {lease.discountNote ? (
              <span className="text-fg-muted">· {lease.discountNote}</span>
            ) : null}
          </p>
        ) : null}
        {billing ? (
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Stat
              label={t("summaryPaid", {
                paid: billing.paidCount,
                total: billing.invoiceCount,
              })}
              value={formatIdr(billing.paidAmount)}
            />
            <Stat
              label={t("outstanding")}
              value={formatIdr(billing.outstandingAmount)}
              tone={billing.overdueCount > 0 ? "danger" : undefined}
            />
            <Stat
              label={t("lateFees")}
              value={formatIdr(billing.lateFeeAccrued)}
              tone={billing.lateFeeAccrued > 0 ? "danger" : undefined}
            />
            <Stat
              label={t("nextDue")}
              value={
                billing.nextInvoice
                  ? formatIdr(billing.nextInvoice.amount)
                  : t("nothingDue")
              }
              hint={
                billing.nextInvoice
                  ? t("dueOn", {
                      date: formatDate(billing.nextInvoice.dueDate, locale),
                    })
                  : undefined
              }
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <fieldset className="inline-flex rounded-full border border-line bg-hover p-1">
            <legend className="sr-only">{t("cycleLabel")}</legend>
            {(["monthly", "upfront"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={cycle === option}
                onClick={() => option !== cycle && setSwitchTo(option)}
                className={cn(
                  "h-8 rounded-full px-4 text-sm transition-colors",
                  cycle === option
                    ? "bg-panel font-medium text-fg shadow-[0_1px_3px_rgb(11_11_13/0.18)]"
                    : "text-fg-2 hover:text-fg",
                )}
              >
                {option === "monthly" ? t("cycleMonthly") : t("cycleUpfront")}
              </button>
            ))}
          </fieldset>
          {dueOpen.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelected(new Set(dueOpen.map((inv) => inv.id)))}
              className="text-sm font-medium text-brand hover:underline"
            >
              {t("selectAllDue")}
            </button>
          ) : null}
        </div>

        {invoices.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-fg-muted">
            {t("empty")}
          </p>
        ) : (
          <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {invoices.map((inv) => {
              const paid = inv.status === "paid";
              const late = !paid && inv.daysLate > 0;
              const canWaive =
                !inv.lateFeeWaived &&
                (late || (paid && inv.lateFeeCharged > 0));
              return (
                <li
                  key={inv.id}
                  className={cn(
                    "flex gap-3 px-3.5 py-3 sm:px-4",
                    selected.has(inv.id) && "bg-brand-tint",
                    late && !selected.has(inv.id) && "bg-danger-soft/40",
                  )}
                >
                  <div className="pt-0.5">
                    {paid ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-success text-white">
                        <Icon name="check" size={14} />
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggle(inv.id)}
                        aria-label={t("selectBill", { n: inv.sequence })}
                        className="size-5 cursor-pointer rounded accent-[var(--adm-brand)]"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm text-fg">
                        <span className="font-semibold">
                          {t("billLabel", { n: inv.sequence })}
                        </span>
                        <span className="ml-2 text-fg-muted">
                          {formatDate(inv.periodStart, locale)} –{" "}
                          {formatDate(inv.periodEnd, locale)}
                        </span>
                      </p>
                      <p className="text-right text-sm font-semibold tabular-nums text-fg">
                        {inv.discount ? (
                          <span className="mr-1.5 text-xs font-normal text-fg-muted line-through">
                            {formatIdr(inv.amount + inv.discount)}
                          </span>
                        ) : null}
                        {formatIdr(inv.amount)}
                      </p>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-fg-muted">
                      <LeaseStatusBadge status={inv.status} />
                      <span>
                        {paid && inv.paidAt
                          ? t("paidOn", {
                              date: formatDate(inv.paidAt, locale),
                            })
                          : t("dueOn", {
                              date: formatDate(inv.dueDate, locale),
                            })}
                      </span>
                      {paid && inv.paymentMethod === "cash" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-hover px-2 py-0.5 font-medium text-fg-2">
                          <Icon name="payments" size={13} />
                          {t("dialog.paidCash")}
                        </span>
                      ) : null}
                      {late ? (
                        <span className="font-medium text-danger">
                          {t("daysLate", { count: inv.daysLate })}
                        </span>
                      ) : null}
                      {inv.lateFeeWaived ? (
                        <span className="rounded-full bg-hover px-2 py-0.5 text-fg-2">
                          {t("feeWaived")}
                        </span>
                      ) : inv.lateFeeAmount > 0 ? (
                        <span className="font-medium text-danger">
                          {t("lateFee", {
                            amount: formatIdr(inv.lateFeeAmount),
                          })}
                        </span>
                      ) : null}
                      {inv.proofAttachment?.url ? (
                        <a
                          href={inv.proofAttachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                        >
                          <Icon name="attach_file" size={14} />
                          {t("receipt")}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <Popover
                    open={menuFor === inv.id}
                    onOpenChange={(o) => setMenuFor(o ? inv.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("actions", { n: inv.sequence })}
                        className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-hover hover:text-fg"
                      >
                        <Icon name="more_vert" size={18} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="glass-overlay w-60 rounded-xl p-1.5"
                    >
                      {inv.status === "unpaid" ? (
                        <button
                          type="button"
                          className={menuItem}
                          onClick={() =>
                            void setPending(inv, "waiting_for_review")
                          }
                        >
                          <Icon name="pending_actions" size={17} />
                          {t("markReview")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={menuItem}
                          onClick={() => void setPending(inv, "unpaid")}
                        >
                          <Icon name="undo" size={17} />
                          {t("markUnpaid")}
                        </button>
                      )}
                      {canWaive ? (
                        <button
                          type="button"
                          className={menuItem}
                          onClick={() => {
                            setMenuFor(null);
                            setWaiveFor(inv);
                          }}
                        >
                          <Icon name="money_off" size={17} />
                          {t("waiveFee")}
                        </button>
                      ) : null}
                      {inv.lateFeeWaived && !paid ? (
                        <button
                          type="button"
                          className={menuItem}
                          onClick={() => void unwaive(inv)}
                        >
                          <Icon name="attach_money" size={17} />
                          {t("unwaiveFee")}
                        </button>
                      ) : null}
                    </PopoverContent>
                  </Popover>
                </li>
              );
            })}
          </ol>
        )}

        {selected.size > 0 ? (
          <div className="sticky bottom-24 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-white shadow-[0_16px_32px_-16px_rgb(11_11_13/0.6)] lg:bottom-4">
            <p className="text-sm">
              <span className="font-semibold tabular-nums">
                {formatIdr(selectedTotal)}
              </span>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-3 text-white/70 underline-offset-2 hover:text-white hover:underline"
              >
                {t("clearSelection")}
              </button>
            </p>
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-brand-soft"
            >
              <Icon name="payments" size={18} />
              {t("recordPaymentFor", { count: selected.size })}
            </button>
          </div>
        ) : null}
      </div>

      <RecordPaymentDialog
        lease={lease}
        invoices={selectedInvoices}
        open={payOpen}
        onOpenChange={setPayOpen}
        onDone={() => {
          setPayOpen(false);
          setSelected(new Set());
        }}
      />

      <WaiveFeeDialog
        lease={lease}
        invoice={waiveFor}
        onClose={() => setWaiveFor(null)}
      />

      <Dialog
        open={switchTo !== null}
        onOpenChange={(o) => !o && setSwitchTo(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("switchTitle", {
                cycle:
                  switchTo === "monthly"
                    ? t("cycleMonthly")
                    : t("cycleUpfront"),
              })}
            </DialogTitle>
            <DialogDescription>
              {t("switchBody", {
                cycle: (switchTo === "monthly"
                  ? t("cycleMonthly")
                  : t("cycleUpfront")
                ).toLowerCase(),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => setSwitchTo(null)}
            >
              {tc("cancel")}
            </button>
            <button
              type="button"
              className={primaryBtn}
              disabled={mutations.updateBilling.isPending}
              onClick={() => void confirmSwitch()}
            >
              {t("switchConfirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminFormSection>
  );
}

function RecordPaymentDialog({
  lease,
  invoices,
  open,
  onOpenChange,
  onDone,
}: {
  lease: Lease;
  invoices: LeaseInvoice[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const t = useTranslations("admin.pages.leases.billing");
  const td = useTranslations("admin.pages.leases.billing.dialog");
  const tc = useTranslations("admin.crud");
  const locale = useLocale();
  const mutations = useLeaseMutations();
  const [method, setMethod] = useState<"bank_transfer" | "cash">(
    "bank_transfer",
  );
  const [file, setFile] = useState<File | null>(null);
  const [existingId, setExistingId] = useState("");
  const [waive, setWaive] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const receipts = useMemo(
    () => (lease.attachments ?? []).filter((a) => a.kind === "payment"),
    [lease.attachments],
  );
  const rent = invoices.reduce((s, inv) => s + inv.amount, 0);
  const fees = invoices.reduce(
    (s, inv) => s + (inv.lateFeeWaived ? 0 : inv.lateFeeAmount),
    0,
  );
  const everyHasProof = invoices.every((inv) => inv.proofAttachmentId);
  const isCash = method === "cash";
  // Cash payments may have no transfer receipt.
  const hasReceipt = isCash || !!file || !!existingId || everyHasProof;
  const propertyName = lease.property?.name ?? lease.unit?.property?.name ?? "";

  function reset() {
    setMethod("bank_transfer");
    setFile(null);
    setExistingId("");
    setWaive(false);
    setReason("");
    setError(null);
  }

  async function submit() {
    if (!hasReceipt) {
      setError(td("receiptRequired"));
      return;
    }
    try {
      await mutations.confirmInvoices.mutateAsync({
        id: lease.id,
        invoiceIds: invoices.map((inv) => inv.id),
        file,
        proofAttachmentId: file ? undefined : existingId || undefined,
        paymentMethod: method,
        waiveLateFee: waive || undefined,
        waiveReason: waive && reason.trim() ? reason.trim() : undefined,
      });
      showApiSuccess(td("success", { count: invoices.length }));
      reset();
      onDone();
    } catch (err) {
      showApiError(err, tc("saveFailed"));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{td("title")}</DialogTitle>
          <DialogDescription>{td("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ul className="divide-y divide-line rounded-xl border border-line text-sm">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <span className="min-w-0 text-fg">
                  <span className="font-medium">
                    {t("billLabel", { n: inv.sequence })}
                  </span>
                  <span className="ml-2 text-fg-muted">
                    {formatDate(inv.periodStart, locale)} –{" "}
                    {formatDate(inv.periodEnd, locale)}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-fg">
                  {formatIdr(inv.amount)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between text-fg-2">
              <dt>{td("rent")}</dt>
              <dd className="tabular-nums">{formatIdr(rent)}</dd>
            </div>
            {fees > 0 ? (
              <div
                className={cn(
                  "flex justify-between",
                  waive ? "text-fg-faint line-through" : "text-danger",
                )}
              >
                <dt>{td("lateFees")}</dt>
                <dd className="tabular-nums">{formatIdr(fees)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-line pt-2 font-semibold text-fg">
              <dt>{td("total")}</dt>
              <dd className="tabular-nums">
                {formatIdr(rent + (waive ? 0 : fees))}
              </dd>
            </div>
          </dl>

          <div>
            <p className="mb-2 text-sm font-medium text-fg">{td("method")}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["bank_transfer", "cash"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={method === option}
                  onClick={() => setMethod(option)}
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors",
                    method === option
                      ? "border-brand bg-brand-tint text-fg"
                      : "border-line text-fg-2 hover:border-line-strong",
                  )}
                >
                  <Icon
                    name={option === "cash" ? "payments" : "account_balance"}
                    size={18}
                    className={
                      method === option ? "text-brand" : "text-fg-muted"
                    }
                  />
                  {option === "cash" ? td("methodCash") : td("methodBank")}
                </button>
              ))}
            </div>
            {isCash ? (
              <p className="mt-2 text-xs text-fg-muted">
                {td("methodCashHint", { property: propertyName })}
              </p>
            ) : null}
          </div>

          <AdminField
            label={isCash ? td("receiptOptional") : td("receiptLabel")}
            htmlFor="pay-receipt"
          >
            <div className="space-y-2">
              <AdminFileInput
                id="pay-receipt"
                accept="image/*,application/pdf"
                file={file}
                onFileChange={(f) => {
                  setFile(f);
                  setError(null);
                  if (f) setExistingId("");
                }}
              />
              <p className="text-xs text-fg-muted">{td("receiptUpload")}</p>
              {receipts.length > 0 && !file ? (
                <AdminSelect
                  aria-label={td("receiptExisting")}
                  value={existingId}
                  onChange={(e) => {
                    setExistingId(e.target.value);
                    setError(null);
                  }}
                >
                  <option value="">{td("receiptExisting")}</option>
                  {receipts.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fileName} · {formatDate(r.createdAt, locale)}
                    </option>
                  ))}
                </AdminSelect>
              ) : null}
            </div>
          </AdminField>

          {fees > 0 ? (
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 text-sm text-fg-2">
                <input
                  type="checkbox"
                  checked={waive}
                  onChange={(e) => setWaive(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--adm-brand)]"
                />
                {td("waive")}
              </label>
              {waive ? (
                <input
                  className={adminInputClassName}
                  placeholder={td("waiveReason")}
                  aria-label={td("waiveReason")}
                  value={reason}
                  maxLength={500}
                  onChange={(e) => setReason(e.target.value)}
                />
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <button
            type="button"
            className={secondaryBtn}
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={mutations.confirmInvoices.isPending}
            onClick={() => void submit()}
          >
            <Icon name="check" size={18} />
            {mutations.confirmInvoices.isPending
              ? td("confirming")
              : td("confirm")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WaiveFeeDialog({
  lease,
  invoice,
  onClose,
}: {
  lease: Lease;
  invoice: LeaseInvoice | null;
  onClose: () => void;
}) {
  const t = useTranslations("admin.pages.leases.billing");
  const tw = useTranslations("admin.pages.leases.billing.waiveDialog");
  const tc = useTranslations("admin.crud");
  const mutations = useLeaseMutations();
  const [reason, setReason] = useState("");

  async function submit() {
    if (!invoice) return;
    try {
      await mutations.setLateFeeWaiver.mutateAsync({
        id: lease.id,
        invoiceId: invoice.id,
        waived: true,
        reason: reason.trim() || undefined,
      });
      showApiSuccess(t("updated"));
      setReason("");
      onClose();
    } catch (err) {
      showApiError(err, tc("saveFailed"));
    }
  }

  return (
    <Dialog open={invoice !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tw("title", { n: invoice?.sequence ?? 0 })}
          </DialogTitle>
          <DialogDescription>{tw("body")}</DialogDescription>
        </DialogHeader>
        <input
          className={adminInputClassName}
          placeholder={tw("reason")}
          aria-label={tw("reason")}
          value={reason}
          maxLength={500}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <button type="button" className={secondaryBtn} onClick={onClose}>
            {tc("cancel")}
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={mutations.setLateFeeWaiver.isPending}
            onClick={() => void submit()}
          >
            {tw("confirm")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
