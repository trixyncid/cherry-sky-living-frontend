export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Strip a currency-masked string down to an integer amount. */
export function parseIdrInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits);
}

/**
 * Format a raw number or partially typed input as `Rp. 1.800.000`.
 * Non-digit characters are ignored so typing stays numeric-only.
 */
export function formatIdrInput(value: string | number): string {
  let digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length > 1) digits = digits.replace(/^0+/, "") || "0";
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp. ${formatted}`;
}

function dateLocale(appLocale?: string): string {
  return appLocale === "en" ? "en-US" : "id-ID";
}

export function formatDate(value: string | Date, appLocale?: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(dateLocale(appLocale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function dayAfterDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
}

export function formatIdrCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return String(amount);
}

export function formatIdrTable(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function isExpiringWithinDays(
  endDate: string | Date,
  days: number,
): boolean {
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() + days);
  return end >= now && end <= limit;
}
