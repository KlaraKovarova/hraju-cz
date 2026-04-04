"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";

const localeLabels: Record<Locale, string> = {
  cs: "CZ",
  en: "EN",
  de: "DE",
  pl: "PL",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = e.target.value as Locale;
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs text-zinc-500 hover:border-zinc-400 focus:border-emerald-500 focus:outline-none"
      aria-label="Language"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeLabels[loc]}
        </option>
      ))}
    </select>
  );
}
