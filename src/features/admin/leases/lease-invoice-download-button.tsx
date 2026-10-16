"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { buildLeaseInvoice } from "@/features/admin/leases/build-lease-invoice";
import { downloadLeaseInvoicePdf } from "@/features/admin/leases/generate-lease-invoice-pdf";
import { formatDate, formatIdr } from "@/features/admin/lib/format";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import { cn } from "@/lib/utils";
import type { Lease } from "@/lib/types/admin";

type LeaseInvoiceDownloadButtonProps = {
  lease: Lease;
  className?: string;
  variant?: "primary" | "secondary";
};

export function LeaseInvoiceDownloadButton({
  lease,
  className,
  variant = "primary",
}: LeaseInvoiceDownloadButtonProps) {
  const locale = useLocale();
  const tBrand = useTranslations("common.brand");
  const tContact = useTranslations("contact.info");
  const tp = useTranslations("admin.pages.leases.invoice");
  const [pending, setPending] = useState(false);

  async function handleDownload() {
    setPending(true);
    try {
      const invoice = buildLeaseInvoice(lease, {
        brandName: tBrand("fullName"),
        brandAddressLines: [
          tContact("addressSkykost"),
          tContact("addressCherry"),
        ],
        brandEmail: tContact("emailPrimary"),
        brandPhone: tContact("phonePrimary"),
        rentLineLabel: tp("rentLine"),
        rentLineDescription: tp("rentLineDescription"),
        lateFeeLineLabel: tp("lateFeeLine"),
        lateFeeLineDescription: ({ days, perDay }) =>
          tp("lateFeeLineDescription", { days, perDay }),
        statusPaid: tp("statusPaid"),
        statusUnpaid: tp("statusUnpaid"),
        statusWaitingForReview: tp("statusWaitingForReview"),
        notePaid: tp("notePaid"),
        noteDue: tp("noteDue"),
        noteReview: tp("noteReview"),
        noteOverdue: ({ days }) => tp("noteOverdue", { days }),
        formatMoney: formatIdr,
        formatDate: (value) => formatDate(value, locale),
      });

      downloadLeaseInvoicePdf(invoice, {
        title: tp("pdfTitle"),
        invoiceNumber: tp("invoiceNumber"),
        issuedOn: tp("issuedOn"),
        billTo: tp("billTo"),
        property: tp("property"),
        unit: tp("unit"),
        period: tp("period"),
        paymentDue: tp("paymentDue"),
        status: tp("status"),
        description: tp("description"),
        amount: tp("amount"),
        totalDue: tp("totalDue"),
        totalPaid: tp("totalPaid"),
        notes: tp("notes"),
        thankYou: tp("thankYou"),
        formatMoney: formatIdr,
        formatIssuedDate: (value) => formatDate(value, locale),
      });

      showApiSuccess(tp("downloadSuccess"));
    } catch (err) {
      showApiError(err, tp("downloadFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void handleDownload()}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
        variant === "primary"
          ? "bg-[#71130d] text-white hover:opacity-90"
          : "border border-[#71130d]/30 bg-white text-[#71130d] hover:bg-[#efeeeb]",
        className,
      )}
    >
      <Icon name="picture_as_pdf" size={16} />
      {pending ? tp("generating") : tp("downloadPdf")}
    </button>
  );
}
