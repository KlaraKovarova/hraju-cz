"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

interface TrackPageViewProps {
  eventName: string;
  params?: Record<string, string | number | boolean>;
}

export function TrackPageView({ eventName, params }: TrackPageViewProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent(eventName, params);
  });

  return null;
}
