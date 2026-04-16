"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

interface TrackPageViewProps {
  eventName: string;
  params?: Record<string, string | number | boolean>;
  /**
   * When provided, also fire a POST to /api/facilities/{facilityId}/view
   * to increment daily view counts. Kept client-side so the server page
   * stays cacheable (ISR) — see SIL-641.
   */
  facilityId?: string;
}

export function TrackPageView({ eventName, params, facilityId }: TrackPageViewProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent(eventName, params);

    if (facilityId) {
      // Fire-and-forget — view tracking must never block or fail the page.
      fetch(`/api/facilities/${facilityId}/view`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    }
  }, [eventName, params, facilityId]);

  return null;
}
