// Non-Czech locales disabled until translations exist (SIL-589/SIL-590).
// Re-add "en", "de", "pl" here when ready.
export const locales = ["cs"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "cs";
