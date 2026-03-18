"use client";

import Script from "next/script";
import { useState, useEffect } from "react";
import { getConsent } from "./CookieConsent";

// TODO: Replace with actual Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (getConsent() === "accepted") {
      setConsented(true);
    }

    function onAccepted() {
      setConsented(true);
    }

    window.addEventListener("cookie-consent-accepted", onAccepted);
    return () =>
      window.removeEventListener("cookie-consent-accepted", onAccepted);
  }, []);

  if (!consented || !GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
