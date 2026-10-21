/**
 * Type definitions for i18n translations
 * Provides autocomplete for translation keys
 */

export type Locale = "id" | "en";

export interface TranslationKeys {
  nav: {
    home: string;
    search: string;
    contact: string;
    account: string;
    login: string;
    register: string;
    about: string;
    properties: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    learnMore: string;
    scheduleVisit: string;
  };
  roomTypes: Record<string, string>;
  bathroom: {
    inside: string;
    outside: string;
    shared: string;
  };
  facilities: Record<string, string>;
  status: Record<string, string>;
  pricing: Record<string, string>;
  cta: Record<string, string>;
  search: Record<string, string>;
  property: Record<string, string>;
  footer: Record<string, string>;
  whatsapp: Record<string, string>;
  common: Record<string, string>;
}
