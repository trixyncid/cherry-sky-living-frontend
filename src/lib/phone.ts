const PLACEHOLDER_EMAIL_DOMAIN = "phone.invalid";

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Normalize Indonesian mobile numbers to E.164 (+62…).
 * Accepts 08…, 8…, 62…, +62….
 */
export function normalizeIndonesianPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let digits = digitsOnly(trimmed);
  if (!digits) return null;

  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8") && !digits.startsWith("62")) {
    digits = `62${digits}`;
  }

  if (!digits.startsWith("62")) return null;

  const subscriber = digits.slice(2);
  if (subscriber.length < 8 || subscriber.length > 13) return null;
  if (!/^8\d+$/.test(subscriber)) return null;

  return `+${digits}`;
}

export function isValidIndonesianPhone(raw: string): boolean {
  return normalizeIndonesianPhone(raw) !== null;
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
}

export function displayEmailOrEmpty(email: string | null | undefined): string {
  if (!email || isPlaceholderEmail(email)) return "";
  return email;
}

/** True when the login identifier should use email sign-in. */
export function looksLikeEmail(identifier: string): boolean {
  return identifier.trim().includes("@");
}

/** "+6281234567890" → "+62 812-3456-7890" (falls back to the raw value). */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  const normalized = normalizeIndonesianPhone(phone);
  if (!normalized) return phone.trim();
  const rest = normalized.slice(3);
  const groups = [rest.slice(0, 3), rest.slice(3, 7), rest.slice(7)].filter(
    Boolean,
  );
  return `+62 ${groups.join("-")}`;
}

type ContactSource = {
  email?: string | null;
  phoneNumber?: string | null;
  phone?: string | null;
};

/**
 * The contact details a person actually has: phone and/or real email.
 * Placeholder emails of phone-only tenants are left out.
 */
export function contactParts(user: ContactSource | null | undefined): string[] {
  if (!user) return [];
  const phone = formatPhoneDisplay(user.phoneNumber ?? user.phone);
  const email = displayEmailOrEmpty(user.email);
  return [phone, email].filter(Boolean);
}

/** Contact details on one line ("+62 812-3456-7890 · budi@mail.com"). */
export function contactSummary(user: ContactSource | null | undefined): string {
  return contactParts(user).join(" · ");
}
