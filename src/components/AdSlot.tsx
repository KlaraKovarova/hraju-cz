"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

interface AdSlotProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

const FORMAT_STYLES: Record<string, { minHeight: number; width: string }> = {
  horizontal: { minHeight: 90, width: "100%" },
  vertical: { minHeight: 250, width: "160px" },
  rectangle: { minHeight: 250, width: "100%" },
  auto: { minHeight: 90, width: "100%" },
};

export function AdSlot({ slot, format = "auto", className }: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not loaded — fail silently
    }
  }, []);

  const style = FORMAT_STYLES[format] ?? FORMAT_STYLES.auto;

  return (
    <div className={className} style={{ minHeight: style.minHeight }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: style.width, minHeight: style.minHeight }}
        data-ad-client="ca-pub-0911654773181999"
        data-ad-slot={slot}
        data-ad-format={format === "auto" ? "auto" : undefined}
        data-full-width-responsive={format === "horizontal" || format === "auto" ? "true" : undefined}
      />
    </div>
  );
}
