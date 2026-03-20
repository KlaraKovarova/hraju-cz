import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Footer } from "@/components/Footer";
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0911654773181999"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        {children}
        <Footer />
        <CookieConsent />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
