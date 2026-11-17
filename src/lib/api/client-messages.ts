/**
 * User-facing messages for errors raised by the API client itself (no server
 * message available). apiFetch runs outside React, so it can't use
 * next-intl's hooks; the locale comes from <html lang> (set by
 * app/[locale]/layout.tsx). Defaults to Indonesian, like the app.
 */
export type ClientApiMessageKey =
  | "timeout"
  | "tooManyRequests"
  | "fileTooLarge";

const MESSAGES: Record<"id" | "en", Record<ClientApiMessageKey, string>> = {
  en: {
    timeout: "The server took too long to respond. Please try again.",
    tooManyRequests: "Too many requests, please wait a moment.",
    fileTooLarge: "Each file must be 4 MB or smaller.",
  },
  id: {
    timeout: "Server terlalu lama merespons. Silakan coba lagi.",
    tooManyRequests: "Terlalu banyak permintaan, harap tunggu sebentar.",
    fileTooLarge: "Setiap file harus 4 MB atau lebih kecil.",
  },
};

function currentLocale(): "id" | "en" {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang === "en" ? "en" : "id";
}

export function clientApiMessage(key: ClientApiMessageKey): string {
  return MESSAGES[currentLocale()][key];
}
