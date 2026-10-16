"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminSearchInput } from "@/features/admin/components/admin-field";
import { AdminFilterRow } from "@/features/admin/components/admin-filter-row";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { PropertyFilter } from "@/features/admin/components/property-filter";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  useLeaseMutations,
  useLeases,
} from "@/features/admin/hooks/use-admin-queries";
import {
  EmptyPanel,
  IconAction,
  panel,
  rupiah,
  SkeletonCards,
} from "@/features/admin/inventory/inventory-kit";
import {
  getLeaseEndDateValue,
  resolveLeasePropertyName,
  resolveLeaseTenantLabel,
} from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate } from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import {
  Avatar,
  DueChip,
  daysUntil,
  TermProgress,
} from "@/features/admin/operations/ops-kit";
import { Segmented } from "@/features/admin/overview/dashboard-widgets";
import type { Lease, LeaseStatus } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const BASE = "/admin/leases";
const COLUMN_PREVIEW = 8;

const COLUMNS: {
  status: LeaseStatus;
  key: "colUnpaid" | "colReview" | "colPaid";
  icon: string;
  accent: string;
}[] = [
  {
    status: "unpaid",
    key: "colUnpaid",
    icon: "money_off",
    accent: "bg-[#a1271b]",
  },
  {
    status: "waiting_for_review",
    key: "colReview",
    icon: "rate_review",
    accent: "bg-[#c98a4b]",
  },
  { status: "paid", key: "colPaid", icon: "verified", accent: "bg-[#3f9a52]" },
];

function hasPaymentProof(lease: Lease) {
  return (lease.attachments ?? lease.downpaymentAttachments ?? []).some(
    (a) => a.kind === "payment",
  );
}

/**
 * Leases — a payment board. Each lease sits in Unpaid / Awaiting review /
 * Paid, most urgent first, with confirm/reject right on the card. Phones
 * get the same columns as tabs; "List" gives a compact all-in-one view.
 */
export function LeasesList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.leases");
  const to = useTranslations("admin.pages.operations");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"board" | "list">("board");
  const [mobileColumn, setMobileColumn] = useState<LeaseStatus>("unpaid");
  const {
    data = [],
    isLoading,
    error,
  } = useLeases({
    propertyId: propertyFilter || undefined,
  });
  const mutations = useLeaseMutations();
  const deleteDialog = useDeleteDialog<Lease>();
  const lookups = useAdminLookups();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((lease) =>
      [
        lease.unit?.name ?? lease.unitId,
        resolveLeasePropertyName(lease, lookups),
        resolveLeaseTenantLabel(lease),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, search, lookups]);

  const columns = useMemo(() => {
    const by: Record<LeaseStatus, Lease[]> = {
      unpaid: [],
      waiting_for_review: [],
      paid: [],
    };
    for (const l of filtered) by[l.status]?.push(l);
    by.unpaid.sort((a, b) => (b.daysLate ?? 0) - (a.daysLate ?? 0));
    by.waiting_for_review.sort((a, b) =>
      a.updatedAt.localeCompare(b.updatedAt),
    );
    by.paid.sort((a, b) =>
      (getLeaseEndDateValue(a) ?? "").localeCompare(
        getLeaseEndDateValue(b) ?? "",
      ),
    );
    return by;
  }, [filtered]);

  const kpis = useMemo(() => {
    const unpaid = columns.unpaid;
    return {
      outstanding: unpaid.reduce((s, l) => s + (l.amountDue ?? 0), 0),
      overdue: unpaid.filter((l) => (l.daysLate ?? 0) > 0).length,
      review: columns.waiting_for_review.length,
      ending: columns.paid.filter((l) => {
        const end = getLeaseEndDateValue(l);
        if (!end) return false;
        const d = daysUntil(end);
        return d >= 0 && d <= 30;
      }).length,
    };
  }, [columns]);

  async function confirmDelete() {
    if (!deleteDialog.item) return;
    try {
      await mutations.remove.mutateAsync(deleteDialog.item.id);
      showApiSuccess(t("deleted"));
      deleteDialog.close();
    } catch (err) {
      showApiError(err, t("deleteFailed"));
    }
  }

  const deletePending = mutations.remove.isPending;

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={{ label: t("add"), href: `${BASE}/new`, icon: "add" }}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon="account_balance_wallet"
          tone="red"
          label={to("outstanding")}
          value={rupiah(kpis.outstanding)}
        />
        <Kpi
          icon="warning"
          tone="red"
          label={to("overdue")}
          value={String(kpis.overdue)}
        />
        <Kpi
          icon="rate_review"
          tone="sand"
          label={to("awaitingReview")}
          value={String(kpis.review)}
        />
        <Kpi
          icon="event_upcoming"
          tone="neutral"
          label={to("endingSoon")}
          value={String(kpis.ending)}
        />
      </div>

      <AdminFilterRow
        trailing={
          <Segmented
            label={to("view")}
            value={view}
            onChange={setView}
            options={[
              { id: "board", label: to("board") },
              { id: "list", label: to("list") },
            ]}
          />
        }
      >
        <PropertyFilter value={propertyFilter} onChange={setPropertyFilter} />
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
          className="sm:max-w-md sm:flex-1"
        />
      </AdminFilterRow>

      {error ? (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      ) : null}

      {isLoading ? (
        <SkeletonCards count={3} className="lg:grid-cols-3" />
      ) : filtered.length === 0 ? (
        <EmptyPanel icon="description" title={t("empty")} />
      ) : view === "board" ? (
        <>
          {/* Phones: one column at a time */}
          <div className="mb-3 lg:hidden">
            <Segmented
              label={to("board")}
              value={mobileColumn}
              onChange={setMobileColumn}
              options={COLUMNS.map((c) => ({
                id: c.status,
                label: `${to(c.key)} · ${columns[c.status].length}`,
              }))}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {COLUMNS.map((col) => (
              <BoardColumn
                key={col.status}
                column={col}
                leases={columns[col.status]}
                hiddenOnMobile={mobileColumn !== col.status}
                onDelete={(l) => deleteDialog.openDelete(l)}
                deleteDisabled={deletePending}
              />
            ))}
          </div>
        </>
      ) : (
        <section
          className={cn(panel, "divide-y divide-[#f1ebea] overflow-hidden")}
        >
          {[
            ...columns.unpaid,
            ...columns.waiting_for_review,
            ...columns.paid,
          ].map((lease) => (
            <ListRow
              key={lease.id}
              lease={lease}
              onDelete={() => deleteDialog.openDelete(lease)}
              deleteDisabled={deletePending}
            />
          ))}
        </section>
      )}

      <AdminDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && deleteDialog.close()}
        itemName={
          deleteDialog.item
            ? `${deleteDialog.item.unit?.name ?? ""} · ${resolveLeaseTenantLabel(deleteDialog.item)}`
            : ""
        }
        onConfirm={confirmDelete}
        pending={deletePending}
      />
    </>
  );
}

function BoardColumn({
  column,
  leases,
  hiddenOnMobile,
  onDelete,
  deleteDisabled,
}: {
  column: (typeof COLUMNS)[number];
  leases: Lease[];
  hiddenOnMobile: boolean;
  onDelete: (lease: Lease) => void;
  deleteDisabled: boolean;
}) {
  const to = useTranslations("admin.pages.operations");
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? leases : leases.slice(0, COLUMN_PREVIEW);

  return (
    <section
      className={cn(
        "flex flex-col rounded-[1.75rem] bg-[#efe8e6]/70 p-2",
        hiddenOnMobile && "hidden lg:flex",
      )}
    >
      <header className="flex items-center justify-between px-3 pb-2 pt-2.5">
        <h3 className="flex items-center gap-2 text-[15px] font-medium text-[#141414]">
          <span className={cn("size-2.5 rounded-full", column.accent)} />
          {to(column.key)}
        </h3>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-sm tabular-nums text-[#3d3a36]">
          {leases.length}
        </span>
      </header>
      <ul className="flex flex-col gap-2">
        {shown.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[#d9cfcc] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            {to("emptyColumn")}
          </li>
        ) : (
          shown.map((lease) => (
            <LeaseCard
              key={lease.id}
              lease={lease}
              onDelete={() => onDelete(lease)}
              deleteDisabled={deleteDisabled}
            />
          ))
        )}
      </ul>
      {leases.length > COLUMN_PREVIEW ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mx-auto mt-2 rounded-full px-4 py-2 text-sm font-medium text-[#71130d] hover:bg-white"
        >
          {expanded ? to("showLess") : to("showAll", { count: leases.length })}
        </button>
      ) : null}
    </section>
  );
}

function LeaseCard({
  lease,
  onDelete,
  deleteDisabled,
}: {
  lease: Lease;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.leases");
  const to = useTranslations("admin.pages.operations");
  const locale = useLocale();
  const lookups = useAdminLookups();
  const mutations = useLeaseMutations();
  const tenant = resolveLeaseTenantLabel(lease);
  const end = getLeaseEndDateValue(lease);
  const proof = hasPaymentProof(lease);
  const late = lease.daysLate ?? 0;
  const busy =
    mutations.confirmPayment.isPending || mutations.rejectPayment.isPending;
  const canConfirm =
    (lease.status === "unpaid" || lease.status === "waiting_for_review") &&
    proof;
  const canReject = lease.status === "waiting_for_review";

  async function run(action: "confirm" | "reject") {
    try {
      if (action === "confirm")
        await mutations.confirmPayment.mutateAsync(lease.id);
      else await mutations.rejectPayment.mutateAsync(lease.id);
      showApiSuccess(
        tp(action === "confirm" ? "statusConfirmed" : "statusRejected"),
      );
    } catch (err) {
      showApiError(err, tp("statusUpdateFailed"));
    }
  }

  return (
    <li className="group rounded-2xl bg-white p-3.5 shadow-[0_1px_0_rgb(0_0_0/0.03)]">
      <div className="flex items-start gap-3">
        <Avatar name={tenant} seed={lease.userId} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-[#141414]">
            {tenant}
          </p>
          <p className="truncate text-xs text-[#6b6b6b]">
            {lease.unit?.name ?? "—"} ·{" "}
            {resolveLeasePropertyName(lease, lookups)}
          </p>
        </div>
        <p className="shrink-0 text-[15px] font-medium tabular-nums text-[#141414]">
          {rupiah(lease.amountDue ?? lease.unitPricing?.price ?? 0)}
        </p>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-[#6b6b6b]">
          <span>{formatDate(lease.startDate, locale)}</span>
          <span>{end ? formatDate(end, locale) : "—"}</span>
        </div>
        {end ? <TermProgress start={lease.startDate} end={end} /> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {lease.status === "unpaid" && late > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fde2df] px-2.5 py-1 text-xs font-medium text-[#a1271b]">
            <Icon name="warning" size={14} />
            {to("daysLate", { count: late })}
          </span>
        ) : null}
        {lease.status !== "paid" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              proof
                ? "bg-[#dff3d6] text-[#2f6d22]"
                : "bg-[#f6f0ef] text-[#6b6b6b]",
            )}
          >
            <Icon name={proof ? "receipt_long" : "hourglass_empty"} size={14} />
            {proof ? to("proofAttached") : to("noProof")}
          </span>
        ) : end ? (
          <DueChip date={end} warnWithin={30} />
        ) : null}
        {lease.leaseRenewal?.isRenewLease ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f3dedb] px-2.5 py-1 text-xs font-medium text-[#71130d]">
            <Icon name="autorenew" size={14} />
            {to("renewalAsked")}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-[#f6f0ef] pt-3">
        {canConfirm ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("confirm")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#71130d] px-3.5 text-sm font-medium text-white hover:bg-[#8a1a12] disabled:opacity-50"
          >
            <Icon name="check" size={16} />
            {tp("confirmPaid")}
          </button>
        ) : null}
        {canReject ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("reject")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#f5c2bd] px-3 text-sm font-medium text-[#a1271b] hover:bg-[#fdecea] disabled:opacity-50"
          >
            <Icon name="close" size={16} />
            {to("reject")}
          </button>
        ) : null}
        <div className="ml-auto flex gap-1.5">
          <IconAction
            icon="open_in_new"
            label={to("openLease")}
            href={`${BASE}/${lease.id}/edit`}
          />
          <IconAction
            icon="delete"
            tone="danger"
            label={t("deleteConfirm")}
            onClick={onDelete}
            disabled={deleteDisabled}
          />
        </div>
      </div>
    </li>
  );
}

function ListRow({
  lease,
  onDelete,
  deleteDisabled,
}: {
  lease: Lease;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  const t = useTranslations("admin.crud");
  const to = useTranslations("admin.pages.operations");
  const locale = useLocale();
  const lookups = useAdminLookups();
  const tenant = resolveLeaseTenantLabel(lease);
  const end = getLeaseEndDateValue(lease);
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[auto_minmax(0,1.3fr)_minmax(0,1fr)_auto_auto_auto] sm:gap-x-5 sm:px-5">
      <Avatar name={tenant} seed={lease.userId} />
      <div className="min-w-0">
        <p className="truncate font-medium text-[#141414]">{tenant}</p>
        <p className="truncate text-xs text-[#6b6b6b]">
          {lease.unit?.name ?? "—"} · {resolveLeasePropertyName(lease, lookups)}
        </p>
      </div>
      <p className="col-span-3 row-start-2 text-sm text-[#3d3a36] sm:col-span-1 sm:row-start-auto">
        {formatDate(lease.startDate, locale)} →{" "}
        {end ? formatDate(end, locale) : "—"}
      </p>
      <span className="hidden sm:block">
        <LeaseStatusBadge status={lease.status} />
      </span>
      <p className="text-right font-medium tabular-nums text-[#141414]">
        {rupiah(lease.amountDue ?? 0)}
      </p>
      <div className="hidden gap-1.5 sm:flex">
        <IconAction
          icon="open_in_new"
          label={to("openLease")}
          href={`${BASE}/${lease.id}/edit`}
        />
        <IconAction
          icon="delete"
          tone="danger"
          label={t("deleteConfirm")}
          onClick={onDelete}
          disabled={deleteDisabled}
        />
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "red" | "sand" | "neutral";
}) {
  return (
    <div className={cn(panel, "flex items-center gap-3 p-4")}>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          tone === "red" && "bg-[#fde2df] text-[#a1271b]",
          tone === "sand" && "bg-[#f9e3c8] text-[#8a5a2b]",
          tone === "neutral" && "bg-[#f6f0ef] text-[#71130d]",
        )}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-[#6b6b6b]">{label}</p>
        <p className="truncate text-xl font-medium tracking-tight tabular-nums text-[#141414]">
          {value}
        </p>
      </div>
    </div>
  );
}
