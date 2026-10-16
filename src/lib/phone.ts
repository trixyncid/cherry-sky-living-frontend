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
