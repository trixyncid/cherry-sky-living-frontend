import { ApiError } from "@/lib/api/errors";
import { formatPhoneDisplay, normalizePhone } from "@/lib/phone";

/** Matches MAX_PHONES_PER_USER on the backend (lib/user-phones.ts). */
export const MAX_PHONES = 5;

export type PhoneRow = {
  /** Stable React key; not sent to the server. */
  key: string;
  phoneNumber: string;
  label: string;
};

export type PhoneListValue = {
  rows: PhoneRow[];
  /** Key of the row used to sign in. */
  loginKey: string;
};

export type PhoneListPayload = {
  phones: { phoneNumber: string; label: string | null }[];
  loginPhone: string;
};

let seq = 0;
export function newPhoneRow(phoneNumber = "", label = ""): PhoneRow {
  seq += 1;
  return { key: `phone-${seq}`, phoneNumber, label };
}

export function emptyPhoneList(): PhoneListValue {
  const row = newPhoneRow();
  return { rows: [row], loginKey: row.key };
}

/** Build form state from the server: login number first, then the rest. */
export function phoneListFromUser(user: {
  phoneNumber?: string | null;
  phones?: { phoneNumber: string; label: string | null }[];
}): PhoneListValue {
  const login = user.phoneNumber ?? null;
  const fromServer = user.phones?.length
    ? user.phones
    : login
      ? [{ phoneNumber: login, label: null }]
      : [];
  if (fromServer.length === 0) return emptyPhoneList();

  const sorted = [...fromServer].sort(
    (a, b) => Number(b.phoneNumber === login) - Number(a.phoneNumber === login),
  );
  const rows = sorted.map((p) => newPhoneRow(p.phoneNumber, p.label ?? ""));
  const loginRow =
    rows.find((r) => r.phoneNumber === login) ?? (rows[0] as PhoneRow);
  return { rows, loginKey: loginRow.key };
}

export type PhoneListMessages = {
  required: string;
  invalid: string;
  duplicate: string;
};

/** Ignores blank extra rows; returns the payload or the first problem. */
export function validatePhoneList(
  value: PhoneListValue,
  messages: PhoneListMessages,
): { ok: true; data: PhoneListPayload } | { ok: false; error: string } {
  const filled = value.rows.filter(
    (r) => r.phoneNumber.trim() || r.key === value.loginKey,
  );
  if (filled.length === 0) return { ok: false, error: messages.required };

  const seen = new Set<string>();
  const phones: PhoneListPayload["phones"] = [];
  let loginPhone: string | null = null;
  for (const row of filled) {
    if (!row.phoneNumber.trim()) return { ok: false, error: messages.required };
    const normalized = normalizePhone(row.phoneNumber);
    if (!normalized) return { ok: false, error: messages.invalid };
    if (seen.has(normalized)) return { ok: false, error: messages.duplicate };
    seen.add(normalized);
    phones.push({ phoneNumber: normalized, label: row.label.trim() || null });
    if (row.key === value.loginKey) loginPhone = normalized;
  }
  return {
    ok: true,
    data: {
      phones,
      loginPhone: loginPhone ?? (phones[0]?.phoneNumber as string),
    },
  };
}

/** Comparable form for dirty checks (order-insensitive, normalized). */
export function phoneListSignature(value: PhoneListValue): string {
  const login =
    value.rows.find((r) => r.key === value.loginKey)?.phoneNumber ?? "";
  const entries = value.rows
    .filter((r) => r.phoneNumber.trim())
    .map(
      (r) =>
        `${normalizePhone(r.phoneNumber) ?? r.phoneNumber.trim()}|${r.label.trim()}`,
    )
    .sort();
  return `${normalizePhone(login) ?? login.trim()}::${entries.join(",")}`;
}

/** The normalized login number currently selected (null if blank/invalid). */
export function selectedLoginPhone(value: PhoneListValue): string | null {
  const row = value.rows.find((r) => r.key === value.loginKey);
  return row ? normalizePhone(row.phoneNumber) : null;
}

/**
 * The number named in a "already registered" conflict from the server, e.g.
 * "+6281234567890 is already registered to another person".
 */
export function takenPhoneFromError(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.code !== "CONFLICT") return null;
  const match = /\+[1-9]\d{6,14}/.exec(error.message);
  return match ? formatPhoneDisplay(match[0]) : null;
}
