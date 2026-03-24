import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Footer } from "@/components/Footer";
import { UserNav } from "@/components/UserNav";
import { NewUserBanner } from "@/components/NewUserBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hraju.cz"),
  title: {
    default: "Sportoviště v České republice | hraju.cz",
    template: "%s | hraju.cz",
  },
  description:
    "Najdi sportoviště poblíž sebe. Tenisové kurty, squashové haly, bazény, fitness centra, badminton a další — adresy, kontakty a hodnocení po celé ČR.",
  openGraph: {
    siteName: "hraju.cz",
    locale: "cs_CZ",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "hraju.cz — Sportoviště v České republice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.hraju.cz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <head>
        <link rel="preconnect" href="https://www.hraju.cz" />
        <link rel="alternate" type="text/plain" title="LLMs.txt" href="https://www.hraju.cz/llms.txt" />
        <Script id="gtm" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WSR58VF2');`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WSR58VF2"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0911654773181999"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <UserNav />
        <NewUserBanner />
        {children}
        <Footer />
        <CookieConsent />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
