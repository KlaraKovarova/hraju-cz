"use client";

import Script from "next/script";
import { useEffect } from "react";
import { getConsent } from "./CookieConsent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function grantConsent() {
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
  });
}

export function GoogleAnalytics() {
  useEffect(() => {
    if (getConsent() === "accepted") {
      grantConsent();
    }

    function onAccepted() {
      grantConsent();
    }

    window.addEventListener("cookie-consent-accepted", onAccepted);
    return () =>
      window.removeEventListener("cookie-consent-accepted", onAccepted);
  }, []);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
          });
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
