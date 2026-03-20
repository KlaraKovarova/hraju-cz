"use client";

import { trackEvent } from "@/lib/analytics";

interface TrackClickProps {
  eventName: string;
  params?: Record<string, string | number | boolean>;
  children: React.ReactNode;
}

export function TrackClick({ eventName, params, children }: TrackClickProps) {
  return (
    <span onClick={() => trackEvent(eventName, params)}>
      {children}
    </span>
  );
}
