/**
 * Conversion analytics (landing-page-instructions §10).
 * Sends to GA4 (NEXT_PUBLIC_GA_ID) and/or Plausible
 * (NEXT_PUBLIC_PLAUSIBLE_DOMAIN) when configured; no-op otherwise.
 */

export type AnalyticsEvent =
  | "view_room_list"
  | "filter_used"
  | "view_room_detail"
  | "click_whatsapp"
  | "click_call"
  | "submit_viewing"
  | "submit_inquiry"
  | "submit_waitlist"
  | "gallery_open";

export type AnalyticsParams = Record<
  string,
  string | number | boolean | undefined
>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: AnalyticsParams }) => void;
  }
}

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  const props = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined),
  );
  try {
    window.gtag?.("event", event, props);
    window.plausible?.(event, { props });
  } catch {
    // Analytics must never break the page.
  }
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, props);
  }
}

const UTM_KEY = "csl_lead_source";

export interface LeadSource {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
}

/** Remember first-touch UTM + referrer for this session (§7.2). */
export function captureLeadSource() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(UTM_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const source: LeadSource = {
      utm_source: params.get("utm_source") ?? undefined,
      utm_medium: params.get("utm_medium") ?? undefined,
      utm_campaign: params.get("utm_campaign") ?? undefined,
      referrer: document.referrer || undefined,
    };
    sessionStorage.setItem(UTM_KEY, JSON.stringify(source));
  } catch {
    // Storage may be unavailable (private mode); source is optional.
  }
}

export function getLeadSource(): LeadSource {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? (JSON.parse(raw) as LeadSource) : {};
  } catch {
    return {};
  }
}
