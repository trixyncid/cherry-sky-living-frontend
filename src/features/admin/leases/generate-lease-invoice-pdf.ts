import { GState, jsPDF } from "jspdf";
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
  subtotal?: string;
  /** Totals row label (e.g. "Total"), shown for every status. */
  total?: string;
  amountPaid?: string;
  balanceDue?: string;
  /** Stamp text for unpaid bills past their due date. */
  overdueStamp?: string;
  formatMoney: (amount: number) => string;
  formatIssuedDate: (value: Date) => string;
};

/** Wordmark logo (burgundy on transparent), 720×205 px. */
const LOGO_URL = "/brand/invoice-logo.png";
const LOGO_RATIO = 205 / 720;

const PAGE_W = 210;
const PAGE_H = 297;
const M = 20;
const RIGHT = PAGE_W - M;
const CONTENT_W = RIGHT - M;

type Rgb = readonly [number, number, number];

// Brand tokens shared with the website and admin (globals.css --adm-*).
const INK: Rgb = [11, 11, 13];
const BODY: Rgb = [40, 40, 44];
const MUTED: Rgb = [110, 110, 118];
const RULE: Rgb = [214, 214, 219];
const HAIRLINE: Rgb = [234, 234, 237];
const BRAND: Rgb = [122, 22, 48];
const BRAND_TINT: Rgb = [249, 240, 243];
const SUCCESS: Rgb = [27, 110, 67];
const DANGER: Rgb = [180, 35, 24];

type Font = "helvetica" | "times";
type Style = "normal" | "bold" | "italic";

function setText(
  doc: jsPDF,
  size: number,
  style: Style,
  color: Rgb,
  font: Font = "helvetica",
) {
  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
}

/** Draws text and returns its width; right alignment respects spacing. */
function write(
  doc: jsPDF,
  value: string,
  x: number,
  y: number,
  opts: {
    size?: number;
    style?: Style;
    color?: Rgb;
    font?: Font;
    align?: "left" | "right";
    spacing?: number;
  } = {},
) {
  const {
    size = 9.5,
    style = "normal",
    color = BODY,
    font = "helvetica",
    align = "left",
    spacing = 0,
  } = opts;
  setText(doc, size, style, color, font);
  // jsPDF's own right alignment ignores letter spacing, so place it here.
  const width =
    doc.getTextWidth(value) + spacing * Math.max(0, value.length - 1);
  const left = align === "right" ? x - width : x;
  doc.text(value, left, y, spacing ? { charSpace: spacing } : undefined);
  return width;
}

/** Small spaced capitals used for section labels. */
function label(
  doc: jsPDF,
  value: string,
  x: number,
  y: number,
  align: "left" | "right" = "left",
  color: Rgb = MUTED,
) {
  write(doc, value.toUpperCase(), x, y, {
    size: 7,
    style: "bold",
    color,
    align,
    spacing: 0.6,
  });
}

function wrap(
  doc: jsPDF,
  value: string,
  width: number,
  size: number,
  style: Style = "normal",
) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  return doc.splitTextToSize(value, width) as string[];
}

function rule(
  doc: jsPDF,
  y: number,
  color: Rgb,
  width: number,
  x1 = M,
  x2 = RIGHT,
) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(width);
  doc.line(x1, y, x2, y);
}

/**
 * Rubber stamp ("PAID" / "OVERDUE"): a tilted double-bordered box in the
 * status colour, slightly transparent like ink on paper.
 */
function stamp(doc: jsPDF, text: string, cx: number, cy: number, color: Rgb) {
  const angle = 10;
  const rad = (angle * Math.PI) / 180;
  // y grows downwards in jsPDF, so "up the slope" is negative y.
  const dir = { x: Math.cos(rad), y: -Math.sin(rad) };
  const perp = { x: Math.sin(rad), y: Math.cos(rad) };
  const spacing = 1.6;
  setText(doc, 17, "bold", color);
  const textW = doc.getTextWidth(text) + spacing * (text.length - 1);
  const halfH = 6.5;

  const box = (inset: number) => {
    const w = textW / 2 + 6 - inset;
    const h = halfH - inset;
    const pts = [
      [cx - dir.x * w - perp.x * h, cy - dir.y * w - perp.y * h],
      [cx + dir.x * w - perp.x * h, cy + dir.y * w - perp.y * h],
      [cx + dir.x * w + perp.x * h, cy + dir.y * w + perp.y * h],
      [cx - dir.x * w + perp.x * h, cy - dir.y * w + perp.y * h],
    ];
    const [start] = pts;
    const segments = pts
      .slice(1)
      .map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
    doc.lines(segments, start[0], start[1], [1, 1], "S", true);
  };

  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.85, "stroke-opacity": 0.85 }));
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.8);
  box(0);
  doc.setLineWidth(0.3);
  box(1.4);
  // Baseline a little below the centre line so caps sit in the middle.
  const startX = cx - dir.x * (textW / 2) + perp.x * 1.4;
  const startY = cy - dir.y * (textW / 2) + perp.y * 1.4;
  doc.text(text, startX, startY, { angle, charSpace: spacing });
  doc.restoreGraphicsState();
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * A printable, traditional invoice: letterhead, billed-to and invoice
 * details, an itemised table, a totals column ending in the balance due,
 * and a stamp when the bill is paid or overdue. Burgundy is used sparingly.
 */
export async function downloadLeaseInvoicePdf(
  invoice: LeaseInvoiceModel,
  labels: LeaseInvoicePdfLabels,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = await loadLogo();
  const money = labels.formatMoney;
  const isPaid = invoice.statusTone === "paid";
  const isOverdue = !isPaid && invoice.daysLate > 0;

  // ── Letterhead ────────────────────────────────────────────────────────
  let y = M;
  const logoW = 56;
  const logoH = logoW * LOGO_RATIO;
  if (logo) {
    doc.addImage(logo, "PNG", M, y, logoW, logoH, undefined, "FAST");
  } else {
    write(doc, invoice.brandName, M, y + 9, {
      size: 15,
      style: "bold",
      color: BRAND,
    });
  }
  write(doc, labels.title.toUpperCase(), RIGHT, y + 9, {
    size: 24,
    style: "bold",
    color: INK,
    align: "right",
    spacing: 2.2,
  });
  write(doc, invoice.invoiceNumber, RIGHT, y + 15.5, {
    size: 9.5,
    style: "bold",
    color: BRAND,
    align: "right",
  });

  y += logoH + 5;
  write(
    doc,
    [invoice.brandPhone, invoice.brandEmail].filter(Boolean).join("     "),
    M,
    y,
    { size: 8.5, color: MUTED },
  );
  y += 6;
  rule(doc, y, BRAND, 0.7);

  // ── Billed to (left) · invoice details (right) ───────────────────────
  y += 11;
  const leftW = 82;
  const metaX = RIGHT - 74;

  label(doc, labels.billTo, M, y);
  let ly = y + 6;
  write(doc, invoice.tenantName, M, ly, {
    size: 11.5,
    style: "bold",
    color: INK,
  });
  ly += 5;
  if (invoice.tenantEmail && invoice.tenantEmail !== "—") {
    write(doc, invoice.tenantEmail, M, ly, { size: 9, color: MUTED });
    ly += 9;
  } else {
    ly += 4;
  }
  label(doc, labels.property, M, ly);
  ly += 5.5;
  write(doc, invoice.propertyName, M, ly, {
    size: 9.5,
    style: "bold",
    color: INK,
  });
  ly += 4.6;
  const address = wrap(doc, invoice.propertyAddress, leftW, 9);
  write(doc, address.join("\n"), M, ly, { size: 9, color: MUTED });
  ly += address.length * 4 + 0.6;
  const unitLabel = invoice.unitTypeName
    ? `${invoice.unitName} · ${invoice.unitTypeName}`
    : invoice.unitName;
  const prefixW = write(doc, `${labels.unit}  `, M, ly, {
    size: 9,
    color: MUTED,
  });
  write(doc, unitLabel, M + prefixW, ly, { size: 9, color: BODY });

  const meta: [string, string, Rgb?][] = [
    [labels.issuedOn, labels.formatIssuedDate(invoice.issuedAt)],
    [labels.paymentDue, invoice.paymentDueDate ?? "—"],
    [labels.period, `${invoice.periodStart} – ${invoice.periodEnd}`],
    [
      labels.status,
      invoice.statusLabel,
      isPaid ? SUCCESS : isOverdue ? DANGER : BODY,
    ],
  ];
  let my = y;
  for (const [key, value, color] of meta) {
    write(doc, key, metaX, my, { size: 8.5, color: MUTED });
    write(doc, value, RIGHT, my, {
      size: 9,
      style: "bold",
      color: color ?? INK,
      align: "right",
    });
    my += 3.6;
    rule(doc, my, HAIRLINE, 0.2, metaX, RIGHT);
    my += 4.8;
  }

  // ── Items ─────────────────────────────────────────────────────────────
  y = Math.max(ly, my) + 12;
  const descX = M + 10;
  rule(doc, y, INK, 0.5);
  y += 5;
  label(doc, "#", M, y, "left", INK);
  label(doc, labels.description, descX, y, "left", INK);
  label(doc, labels.amount, RIGHT, y, "right", INK);
  y += 3;
  rule(doc, y, RULE, 0.25);

  invoice.lines.forEach((line, i) => {
    y += 6.5;
    write(doc, String(i + 1).padStart(2, "0"), M, y, {
      size: 9,
      color: MUTED,
    });
    write(doc, line.label, descX, y, { size: 9.5, style: "bold", color: INK });
    write(doc, money(line.amount), RIGHT, y, {
      size: 9.5,
      color: line.amount < 0 ? SUCCESS : INK,
      align: "right",
    });
    if (line.description) {
      const desc = wrap(doc, line.description, CONTENT_W - 60, 8.5);
      y += 4.4;
      write(doc, desc.join("\n"), descX, y, { size: 8.5, color: MUTED });
      y += (desc.length - 1) * 3.8;
    }
    y += 4;
    if (i < invoice.lines.length - 1) rule(doc, y, HAIRLINE, 0.2);
  });
  rule(doc, y, INK, 0.5);

  // ── Totals (right) · stamp and notes (left) ──────────────────────────
  y += 9;
  const totalsTop = y;
  const totX = RIGHT - 78;
  const rentLine = invoice.lines.find((l) => l.key === "rent");
  const discountLine = invoice.lines.find((l) => l.key === "discount");
  const lateLine = invoice.lines.find((l) => l.key === "late_fee");

  const totalRow = (key: string, value: string, color: Rgb = BODY) => {
    write(doc, key, totX, y, { size: 9, color: MUTED });
    write(doc, value, RIGHT, y, { size: 9.5, color, align: "right" });
    y += 6;
  };
  totalRow(
    labels.subtotal ?? "Subtotal",
    money(rentLine?.amount ?? invoice.rentAmount),
  );
  if (discountLine) {
    totalRow(discountLine.label, money(discountLine.amount), SUCCESS);
  }
  if (lateLine) totalRow(lateLine.label, money(lateLine.amount));
  y -= 1.5;
  rule(doc, y, RULE, 0.25, totX, RIGHT);
  y += 6;
  write(doc, labels.total ?? labels.totalDue, totX, y, {
    size: 10,
    style: "bold",
    color: INK,
  });
  write(doc, money(invoice.totalAmount), RIGHT, y, {
    size: 10.5,
    style: "bold",
    color: INK,
    align: "right",
  });
  y += 6;
  if (isPaid) {
    totalRow(
      labels.amountPaid ?? labels.totalPaid,
      money(-invoice.totalAmount),
      SUCCESS,
    );
  }

  // Balance due band
  y += 1;
  const bandH = 12;
  doc.setFillColor(BRAND_TINT[0], BRAND_TINT[1], BRAND_TINT[2]);
  doc.rect(totX - 4, y, RIGHT - totX + 4, bandH, "F");
  doc.setFillColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.rect(totX - 4, y, 1, bandH, "F");
  label(
    doc,
    labels.balanceDue ?? labels.totalDue,
    totX,
    y + 7.4,
    "left",
    BRAND,
  );
  write(doc, money(isPaid ? 0 : invoice.totalAmount), RIGHT - 3, y + 8, {
    size: 13,
    style: "bold",
    color: BRAND,
    align: "right",
  });
  const totalsBottom = y + bandH;

  // Left column: stamp, then notes
  let ny = totalsTop;
  const noteW = totX - M - 14;
  if (isPaid || isOverdue) {
    const stampText = isPaid
      ? invoice.statusLabel
      : (labels.overdueStamp ?? "Overdue");
    stamp(
      doc,
      stampText.toUpperCase(),
      M + 30,
      ny + 7,
      isPaid ? SUCCESS : DANGER,
    );
    ny += 24;
  }
  const note = invoice.notes[0];
  if (note) {
    label(doc, labels.notes, M, ny);
    const noteLines = wrap(doc, note, noteW, 8.5);
    write(doc, noteLines.join("\n"), M, ny + 5, { size: 8.5, color: BODY });
  }

  // ── Sign-off and footer ───────────────────────────────────────────────
  const signY = Math.max(totalsBottom + 22, PAGE_H - 46);
  write(doc, labels.thankYou, M, signY, {
    size: 13,
    style: "italic",
    color: BRAND,
    font: "times",
  });
  write(doc, invoice.brandName, M, signY + 6, { size: 8.5, color: MUTED });

  const footY = PAGE_H - 18;
  rule(doc, footY, RULE, 0.25);
  // One address per line so neither breaks mid-way.
  invoice.brandAddressLines.forEach((line, i) => {
    write(doc, line, M, footY + 5 + i * 3.6, { size: 7.5, color: MUTED });
  });
  write(doc, invoice.invoiceNumber, RIGHT, footY + 5, {
    size: 7.5,
    color: MUTED,
    align: "right",
  });

  doc.save(leaseInvoiceFileName(invoice));
}
