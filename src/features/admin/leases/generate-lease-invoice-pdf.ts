import { jsPDF } from "jspdf";
import {
  type LeaseInvoiceModel,
  leaseInvoiceFileName,
} from "@/features/admin/leases/build-lease-invoice";

export type LeaseInvoicePdfLabels = {
  title: string;
  invoiceNumber: string;
  issuedOn: string;
  billTo: string;
  property: string;
  unit: string;
  period: string;
  paymentDue: string;
  status: string;
  description: string;
  amount: string;
  totalDue: string;
  totalPaid: string;
  notes: string;
  thankYou: string;
  formatMoney: (amount: number) => string;
  formatIssuedDate: (value: Date) => string;
};

const MARGIN = 24;
const CONTENT_WIDTH = 162;
const PAGE_RIGHT = MARGIN + CONTENT_WIDTH;

const INK = [28, 28, 28] as const;
const MUTED = [110, 110, 110] as const;
const FAINT = [180, 180, 180] as const;
const RULE = [220, 220, 220] as const;

function text(
  doc: jsPDF,
  value: string,
  x: number,
  y: number,
  opts?: {
    size?: number;
    style?: "normal" | "bold";
    color?: readonly [number, number, number];
    align?: "left" | "right";
    maxWidth?: number;
  },
) {
  const {
    size = 10,
    style = "normal",
    color = INK,
    align = "left",
    maxWidth,
  } = opts ?? {};
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(value, x, y, {
    align,
    ...(maxWidth != null ? { maxWidth } : {}),
  });
}

function rule(doc: jsPDF, y: number, weight = 0.2) {
  doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
  doc.setLineWidth(weight);
  doc.line(MARGIN, y, PAGE_RIGHT, y);
}

function labelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth = 70,
): number {
  text(doc, label, x, y, { size: 8, color: MUTED });
  const lines = doc.splitTextToSize(value, maxWidth) as string[];
  text(doc, lines[0] ?? value, x, y + 5, {
    size: 10,
    style: "normal",
    maxWidth,
  });
  if (lines.length > 1) {
    text(doc, lines.slice(1).join(" "), x, y + 9.5, {
      size: 9,
      color: MUTED,
      maxWidth,
    });
    return 14;
  }
  return 10;
}

/**
 * Renders a simple, elegant lease invoice PDF and downloads it.
 */
export function downloadLeaseInvoicePdf(
  invoice: LeaseInvoiceModel,
  labels: LeaseInvoicePdfLabels,
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = MARGIN;

  // Header — brand left, title right
  text(doc, invoice.brandName, MARGIN, y, { size: 13, style: "bold" });
  text(doc, labels.title, PAGE_RIGHT, y, {
    size: 13,
    style: "bold",
    align: "right",
    color: MUTED,
  });

  y += 6;
  text(doc, invoice.brandEmail, MARGIN, y, { size: 8, color: MUTED });
  text(doc, invoice.brandPhone, MARGIN, y + 4, { size: 8, color: MUTED });

  y += 14;
  rule(doc, y, 0.35);
  y += 10;

  // Meta — invoice no. / date / status as quiet text
  text(doc, labels.invoiceNumber, MARGIN, y, { size: 8, color: MUTED });
  text(doc, labels.issuedOn, MARGIN + 58, y, { size: 8, color: MUTED });
  text(doc, labels.status, MARGIN + 110, y, { size: 8, color: MUTED });

  y += 5;
  text(doc, invoice.invoiceNumber, MARGIN, y, { size: 10, style: "bold" });
  text(doc, labels.formatIssuedDate(invoice.issuedAt), MARGIN + 58, y, {
    size: 10,
  });
  text(doc, invoice.statusLabel, MARGIN + 110, y, { size: 10 });

  y += 14;

  // Two quiet columns: bill to | stay details
  const colGap = 12;
  const colW = (CONTENT_WIDTH - colGap) / 2;
  const rightCol = MARGIN + colW + colGap;

  text(doc, labels.billTo, MARGIN, y, { size: 8, color: MUTED });
  text(doc, labels.property, rightCol, y, { size: 8, color: MUTED });

  y += 5;
  text(doc, invoice.tenantName, MARGIN, y, { size: 11, style: "bold" });
  text(doc, invoice.propertyName, rightCol, y, { size: 11, style: "bold" });

  y += 5;
  text(doc, invoice.tenantEmail, MARGIN, y, {
    size: 9,
    color: MUTED,
    maxWidth: colW,
  });
  const addressLines = doc.splitTextToSize(
    invoice.propertyAddress,
    colW,
  ) as string[];
  text(doc, addressLines.join("\n"), rightCol, y, {
    size: 9,
    color: MUTED,
    maxWidth: colW,
  });

  y += Math.max(10, addressLines.length * 4 + 4);

  const unitLabel = invoice.unitTypeName
    ? `${invoice.unitName} · ${invoice.unitTypeName}`
    : invoice.unitName;

  let detailY = y;
  detailY += labelValue(doc, labels.unit, unitLabel, MARGIN, detailY, colW);
  detailY += 8;
  labelValue(
    doc,
    labels.period,
    `${invoice.periodStart} – ${invoice.periodEnd}`,
    MARGIN,
    detailY,
    colW,
  );

  if (invoice.paymentDueDate) {
    labelValue(
      doc,
      labels.paymentDue,
      invoice.paymentDueDate,
      rightCol,
      y,
      colW,
    );
  }

  y = detailY + 18;
  rule(doc, y);
  y += 8;

  // Line items — label / amount only
  text(doc, labels.description, MARGIN, y, { size: 8, color: MUTED });
  text(doc, labels.amount, PAGE_RIGHT, y, {
    size: 8,
    color: MUTED,
    align: "right",
  });

  y += 4;
  rule(doc, y);
  y += 8;

  for (const line of invoice.lines) {
    text(doc, line.label, MARGIN, y, { size: 10 });
    text(doc, labels.formatMoney(line.amount), PAGE_RIGHT, y, {
      size: 10,
      align: "right",
    });
    y += 6;
    if (line.description) {
      text(doc, line.description, MARGIN, y, {
        size: 8,
        color: MUTED,
        maxWidth: 110,
      });
      y += 6;
    }
    y += 2;
  }

  rule(doc, y);
  y += 10;

  // Total — calm and prominent
  const totalLabel =
    invoice.statusTone === "paid" ? labels.totalPaid : labels.totalDue;
  text(doc, totalLabel, MARGIN, y, { size: 10, color: MUTED });
  text(doc, labels.formatMoney(invoice.totalAmount), PAGE_RIGHT, y, {
    size: 16,
    style: "bold",
    align: "right",
  });

  y += 16;
  rule(doc, y, 0.35);
  y += 10;

  // Single short note
  const note = invoice.notes[0];
  if (note) {
    text(doc, labels.notes, MARGIN, y, { size: 8, color: MUTED });
    y += 5;
    const noteLines = doc.splitTextToSize(note, CONTENT_WIDTH) as string[];
    text(doc, noteLines.join("\n"), MARGIN, y, {
      size: 9,
      color: MUTED,
      maxWidth: CONTENT_WIDTH,
    });
    y += noteLines.length * 4.2 + 10;
  }

  // Footer
  text(doc, labels.thankYou, MARGIN, y, { size: 9, color: FAINT });
  y += 5;
  text(
    doc,
    [invoice.brandName, invoice.brandEmail, invoice.brandPhone].join("  ·  "),
    MARGIN,
    y,
    { size: 8, color: FAINT },
  );

  doc.save(leaseInvoiceFileName(invoice));
}
