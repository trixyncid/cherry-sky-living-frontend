/**
 * Public contact number (WhatsApp and phone). Hardcoded on purpose so every
 * environment shows the same number.
 */

export const CONTACT_WHATSAPP_NUMBER = "+6281269175252";
/** Same number, formatted for reading. */
export const CONTACT_PHONE_DISPLAY = "+62 812-6917-5252";

export function getContactWhatsAppNumber(): string {
  return CONTACT_WHATSAPP_NUMBER;
}
