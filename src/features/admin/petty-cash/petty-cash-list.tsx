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
import { AdminAlert } from "@/features/admin/components/admin-alert";
import {
  AdminCurrencyInput,
  AdminDateRangePicker,
  AdminField,
  AdminSelect,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  AdminToolbar,
  usePropertyToolbarFilter,
} from "@/features/admin/components/admin-toolbar";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import { useAdminPropertyFilter } from "@/features/admin/hooks/use-admin-property-filter";
import {
  usePettyCash,
  usePettyCashMutations,
} from "@/features/admin/hooks/use-admin-queries";
import {
  EmptyPanel,
  panel,
  SkeletonCards,
} from "@/features/admin/inventory/inventory-kit";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  formatDate,
  formatIdr,
  parseIdrInput,
} from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { Link } from "@/i18n/routing";
import type {
  ManualPettyCashType,
  PettyCashEntry,
  PettyCashEntryType,
} from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const BASE = "/admin/petty-cash";

/** Below this, a cash box is flagged "running low". */
export const PETTY_CASH_LOW_BALANCE = 200_000;

export const PETTY_CASH_TYPE_ICON: Record<PettyCashEntryType, string> = {
  top_up: "add_card",
  expense: "shopping_bag",
  cash_in: "south_west",
  return_to_bank: "account_balance",
  adjustment: "calculate",
};

const QUICK_ACTIONS: ManualPettyCashType[] = [
  "top_up",
  "cash_in",
  "return_to_bank",
];

const secondaryBtn =
  "inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-panel px-4 text-sm font-medium text-fg transition-colors hover:border-fg hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

function signedRupiah(amount: number): string {
  return `${amount > 0 ? "+" : amount < 0 ? "−" : ""}${formatIdr(Math.abs(amount))}`;
}

/**
 * Petty cash — a cash book per property, separate from the bank ledger.
 * Balance cards per property, quick actions, filters and the entry list with
 * the running balance; entries are voided, never deleted.
 */
export function PettyCashList() {
  const tp = useTranslations("admin.pages.pettyCash");
  const tb = useTranslations("admin.pages.bookkeeping");
  const tt = useTranslations("admin.toolbar");
  const tc = useTranslations("admin.crud");
  const locale = useLocale();
  const { propertyId, setPropertyId } = useAdminPropertyFilter();
  const [type, setType] = useState<"" | PettyCashEntryType>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [showVoided, setShowVoided] = useState(false);
  const [countOpen, setCountOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<PettyCashEntry | null>(null);

  const filters = useMemo(
    () => ({
      propertyId: propertyId || undefined,
      type: type || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [propertyId, type, startDate, endDate],
  );
  const { data, isLoading, error } = usePettyCash(filters);
  const summary = data?.summary;
  const entries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.data ?? []).filter(
      (entry) =>
        (showVoided || !entry.reversedAt) &&
        (!q ||
          [entry.description, entry.property?.name ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [data, search, showVoided]);
  const voidedCount = (data?.data ?? []).filter((e) => e.reversedAt).length;

  const propertyToolbar = usePropertyToolbarFilter(propertyId, setPropertyId);
  const categoryLabel = (category: string | null) =>
    category ? tb(`categories.${category}`) : null;
  const newHref = (entryType: ManualPettyCashType) =>
    `${BASE}/new?type=${entryType}${propertyId ? `&propertyId=${propertyId}` : ""}`;

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={{
          label: tp("actions.expense"),
          href: newHref("expense"),
          icon: PETTY_CASH_TYPE_ICON.expense,
        }}
        className="mb-5"
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action} href={newHref(action)} className={secondaryBtn}>
            <Icon name={PETTY_CASH_TYPE_ICON[action]} size={18} />
            {tp(`actions.${action}`)}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setCountOpen(true)}
          className={secondaryBtn}
        >
          <Icon name={PETTY_CASH_TYPE_ICON.adjustment} size={18} />
          {tp("actions.count")}
        </button>
      </div>

      {/* Cash in each box */}
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading && !summary
          ? [0, 1].map((i) => (
              <div
                key={i}
                className={cn(panel, "h-36 animate-pulse border border-line")}
              />
            ))
          : summary?.balances.map((box) => (
              <BalanceCard
                key={box.propertyId}
                name={box.propertyName}
                balance={box.balance}
                lastCountedAt={box.lastCountedAt}
              />
            ))}
        {summary ? (
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-panel p-5">
            <p className="text-xs text-fg-muted">{tp("periodHint")}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-fg-2">
                  <Icon name="south_west" size={16} className="text-success" />
                  {tp("moneyIn")}
                </dt>
                <dd className="font-semibold tabular-nums text-success">
                  {formatIdr(summary.moneyIn)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-fg-2">
                  <Icon name="north_east" size={16} className="text-brand" />
                  {tp("moneyOut")}
                </dt>
                <dd className="font-semibold tabular-nums text-fg">
                  {formatIdr(summary.moneyOut)}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </section>

      <AdminToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: tc("searchPlaceholder"),
        }}
        filters={[
          {
            key: "type",
            label: tp("filterType"),
            active: type !== "",
            chip: type ? tp(`types.${type}`) : undefined,
            onClear: () => setType(""),
            width: "w-48",
            control: (
              <AdminSelect
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "" | PettyCashEntryType)
                }
              >
                <option value="">{tp("allTypes")}</option>
                {(
                  Object.keys(PETTY_CASH_TYPE_ICON) as PettyCashEntryType[]
                ).map((entryType) => (
                  <option key={entryType} value={entryType}>
                    {tp(`types.${entryType}`)}
                  </option>
                ))}
              </AdminSelect>
            ),
          },
          propertyToolbar,
          {
            key: "dates",
            label: tt("dates"),
            active: Boolean(startDate || endDate),
            chip:
              startDate || endDate
                ? `${startDate ? formatDate(startDate, locale) : "…"} – ${endDate ? formatDate(endDate, locale) : "…"}`
                : undefined,
            onClear: () => {
              setStartDate("");
              setEndDate("");
            },
            width: "w-60",
            control: (
              <AdminDateRangePicker
                from={startDate}
                to={endDate}
                onChange={({ from, to }) => {
                  setStartDate(from);
                  setEndDate(to);
                }}
              />
            ),
          },
        ]}
        trailing={
          voidedCount > 0 ? (
            <label className="flex items-center gap-2 text-sm text-fg-2">
              <input
                type="checkbox"
                checked={showVoided}
                onChange={(e) => setShowVoided(e.target.checked)}
                className="size-4 accent-[var(--adm-brand)]"
              />
              {tp("showVoided")} ({voidedCount})
            </label>
          ) : undefined
        }
        resultCount={isLoading ? undefined : entries.length}
      />

      {error ? (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, tc("loadFailed"))} />
        </div>
      ) : null}

      {isLoading && !data ? (
        <SkeletonCards count={1} />
      ) : entries.length === 0 ? (
        <EmptyPanel
          icon={adminPageIcons.pettyCash}
          title={tp("empty")}
          hint={tp("emptyHint")}
          action={
            <Link
              href={newHref("top_up")}
              className="admin-btn-primary inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium"
            >
              <Icon name={PETTY_CASH_TYPE_ICON.top_up} size={18} />
              {tp("actions.top_up")}
            </Link>
          }
        />
      ) : (
        <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              showProperty={!propertyId}
              categoryLabel={categoryLabel(entry.category)}
              onVoid={() => setVoidTarget(entry)}
            />
          ))}
        </ol>
      )}

      <CountCashDialog
        open={countOpen}
        onOpenChange={setCountOpen}
        defaultPropertyId={propertyId}
        balances={summary?.balances ?? []}
      />
      <VoidEntryDialog entry={voidTarget} onClose={() => setVoidTarget(null)} />
    </>
  );
}

function BalanceCard({
  name,
  balance,
  lastCountedAt,
}: {
  name: string;
  balance: number;
  lastCountedAt: string | null;
}) {
  const tp = useTranslations("admin.pages.pettyCash");
  const locale = useLocale();
  const negative = balance < 0;
  const low = !negative && balance < PETTY_CASH_LOW_BALANCE;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-white">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-brand/40 blur-3xl"
      />
      <div className="relative">
        <p className="flex items-center justify-between gap-2 text-sm text-white/70">
          <span className="truncate">{name}</span>
          {negative || low ? (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                negative
                  ? "bg-danger text-white"
                  : "bg-warning-soft text-warning",
              )}
            >
              {negative ? tp("negative") : tp("lowBalance")}
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-white/50">{tp("balance")}</p>
        <p
          className={cn(
            "mt-0.5 text-[clamp(1.5rem,2.2vw,1.9rem)] font-semibold tracking-tight tabular-nums",
            negative && "text-brand-bright",
          )}
        >
          {negative ? "−" : ""}
          {formatIdr(Math.abs(balance))}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-white/55">
          <Icon name={PETTY_CASH_TYPE_ICON.adjustment} size={14} />
          {lastCountedAt
            ? tp("lastCounted", { date: formatDate(lastCountedAt, locale) })
            : tp("neverCounted")}
        </p>
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  showProperty,
  categoryLabel,
  onVoid,
}: {
  entry: PettyCashEntry;
  showProperty: boolean;
  categoryLabel: string | null;
  onVoid: () => void;
}) {
  const tp = useTranslations("admin.pages.pettyCash");
  const locale = useLocale();
  const voided = Boolean(entry.reversedAt);
  const fromBill = Boolean(entry.invoiceId);
  const editable = !voided && !fromBill && entry.type !== "adjustment";
  const receipt = entry.attachments?.[0];

  return (
    <li
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 sm:px-5",
        voided && "bg-subtle",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
          entry.amount > 0
            ? "bg-success-soft text-success"
            : entry.amount < 0
              ? "bg-brand-soft text-brand"
              : "bg-hover text-fg-muted",
        )}
      >
        <Icon name={PETTY_CASH_TYPE_ICON[entry.type]} size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[15px] font-medium text-fg",
            voided && "text-fg-muted line-through",
          )}
        >
          {entry.description}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
          <span className="font-medium text-fg-2">
            {tp(`types.${entry.type}`)}
          </span>
          {categoryLabel ? <span>· {categoryLabel}</span> : null}
          {showProperty && entry.property ? (
            <span>· {entry.property.name}</span>
          ) : null}
          <span>· {formatDate(entry.date, locale)}</span>
          {fromBill && entry.invoice ? (
            <Link
              href={`/admin/leases/${entry.invoice.leaseId}/edit`}
              className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
            >
              · {tp("fromBill", { n: entry.invoice.sequence })}
            </Link>
          ) : null}
          {receipt?.url ? (
            <a
              href={receipt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-brand hover:underline"
            >
              <Icon name="attach_file" size={13} />
              {tp("receipt")}
            </a>
          ) : null}
          {voided ? (
            <span className="rounded-full bg-hover px-2 py-0.5 font-semibold text-fg-2">
              {tp("voided")}
              {entry.voidReason
                ? ` · ${tp("voidReason", { reason: entry.voidReason })}`
                : ""}
            </span>
          ) : null}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-[15px] font-semibold tabular-nums",
            voided
              ? "text-fg-faint line-through"
              : entry.amount > 0
                ? "text-success"
                : "text-fg",
          )}
        >
          {signedRupiah(entry.amount)}
        </p>
        {!voided && entry.balanceAfter !== undefined ? (
          <p className="mt-0.5 text-xs tabular-nums text-fg-muted">
            {formatIdr(entry.balanceAfter)}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {editable ? (
          <Link
            href={`${BASE}/${entry.id}/edit`}
            aria-label={tp("edit")}
            title={tp("edit")}
            className="flex size-8 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-hover hover:text-fg"
          >
            <Icon name="edit" size={17} />
          </Link>
        ) : null}
        {!voided && !fromBill ? (
          <button
            type="button"
            onClick={onVoid}
            aria-label={tp("void")}
            title={tp("void")}
            className="flex size-8 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Icon name="block" size={17} />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function CountCashDialog({
  open,
  onOpenChange,
  defaultPropertyId,
  balances,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPropertyId: string;
  balances: { propertyId: string; propertyName: string; balance: number }[];
}) {
  const td = useTranslations("admin.pages.pettyCash.countDialog");
  const tc = useTranslations("admin.crud");
  const mutations = usePettyCashMutations();
  const [propertyId, setPropertyId] = useState("");
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");

  const selectedId =
    propertyId || defaultPropertyId || balances[0]?.propertyId || "";
  const book = balances.find((b) => b.propertyId === selectedId)?.balance ?? 0;
  const countedAmount = parseIdrInput(counted);
  const difference = counted.trim() ? countedAmount - book : null;

  async function submit() {
    if (!selectedId || !counted.trim()) return;
    try {
      await mutations.count.mutateAsync({
        propertyId: selectedId,
        countedAmount,
        note: note.trim() || undefined,
      });
      showApiSuccess(td("done"));
      setCounted("");
      setNote("");
      onOpenChange(false);
    } catch (err) {
      showApiError(err, tc("saveFailed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{td("title")}</DialogTitle>
          <DialogDescription>{td("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {balances.length > 1 ? (
            <AdminField label={tc("property")} htmlFor="count-property">
              <AdminSelect
                id="count-property"
                value={selectedId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                {balances.map((b) => (
                  <option key={b.propertyId} value={b.propertyId}>
                    {b.propertyName}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          ) : null}
          <AdminField label={td("counted")} htmlFor="count-amount" required>
            <AdminCurrencyInput
              id="count-amount"
              value={counted}
              onValueChange={setCounted}
              placeholder="Rp. 0"
            />
          </AdminField>
          <dl className="space-y-1.5 rounded-xl bg-subtle px-4 py-3 text-sm">
            <div className="flex justify-between text-fg-2">
              <dt>{td("book")}</dt>
              <dd className="tabular-nums">{formatIdr(book)}</dd>
            </div>
            {difference !== null ? (
              <div className="flex justify-between font-semibold">
                <dt>{td("difference")}</dt>
                <dd
                  className={cn(
                    "tabular-nums",
                    difference === 0
                      ? "text-success"
                      : difference < 0
                        ? "text-danger"
                        : "text-warning",
                  )}
                >
                  {difference === 0
                    ? td("matches")
                    : difference > 0
                      ? td("over", { amount: formatIdr(difference) })
                      : td("short", { amount: formatIdr(-difference) })}
                </dd>
              </div>
            ) : null}
          </dl>
          <input
            className={adminInputClassName}
            placeholder={td("note")}
            aria-label={td("note")}
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
          />
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
            disabled={!counted.trim() || mutations.count.isPending}
            onClick={() => void submit()}
            className="admin-btn-primary inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium disabled:opacity-50"
          >
            <Icon name={PETTY_CASH_TYPE_ICON.adjustment} size={18} />
            {td("confirm")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VoidEntryDialog({
  entry,
  onClose,
}: {
  entry: PettyCashEntry | null;
  onClose: () => void;
}) {
  const td = useTranslations("admin.pages.pettyCash.voidDialog");
  const tc = useTranslations("admin.crud");
  const mutations = usePettyCashMutations();
  const [reason, setReason] = useState("");

  async function submit() {
    if (!entry) return;
    try {
      await mutations.void.mutateAsync({
        id: entry.id,
        reason: reason.trim() || undefined,
      });
      showApiSuccess(td("done"));
      setReason("");
      onClose();
    } catch (err) {
      showApiError(err, tc("saveFailed"));
    }
  }

  return (
    <Dialog open={entry !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{td("title")}</DialogTitle>
          <DialogDescription>
            {entry
              ? `${entry.description} · ${signedRupiah(entry.amount)}`
              : null}
            <span className="mt-2 block">{td("body")}</span>
          </DialogDescription>
        </DialogHeader>
        <input
          className={adminInputClassName}
          placeholder={td("reason")}
          aria-label={td("reason")}
          value={reason}
          maxLength={300}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <button type="button" className={secondaryBtn} onClick={onClose}>
            {tc("cancel")}
          </button>
          <button
            type="button"
            disabled={mutations.void.isPending}
            onClick={() => void submit()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-danger px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {td("confirm")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
