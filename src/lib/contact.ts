/**
 * Public contact details from env.
 * Prefer NEXT_PUBLIC_WHATSAPP_NUMBER so client components can read it.
 */

const DEFAULT_WHATSAPP_NUMBER = "08116359119";

export function getContactWhatsAppNumber(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
  return fromEnv || DEFAULT_WHATSAPP_NUMBER;
}
