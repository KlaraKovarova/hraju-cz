declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  window.gtag?.("event", eventName, params);
}

export function trackSearchPerformed(query: string, sport?: string) {
  trackEvent("search_performed", { query, ...(sport && { sport }) });
}

export function trackFacilityClaimClick(facilitySlug: string, sport: string, city: string) {
  trackEvent("facility_claim_click", { facilitySlug, sport, city });
}

export function trackOutboundClick(type: "website" | "phone" | "email" | "booking", facilitySlug: string) {
  trackEvent("outbound_click", { type, facilitySlug });
}
