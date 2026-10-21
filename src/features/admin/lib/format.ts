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

const BUSINESS_TIMEZONE = "Asia/Jakarta";

export function formatDate(value: string | Date, appLocale?: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(dateLocale(appLocale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: BUSINESS_TIMEZONE,
  }).format(date);
}

/** YYYY-MM-DD for date inputs — Asia/Jakarta calendar day (not UTC). */
export function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Next calendar day as YYYY-MM-DD (date-only arithmetic, no UTC shift). */
export function dayAfterDate(value: string | Date): string {
  const key =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)
      ? value.slice(0, 10)
      : toDateInputValue(value);
  const [y, m, d] = key.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function formatIdrCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    const millions = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(amount / 1_000_000);
    return `${millions} juta`;
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
