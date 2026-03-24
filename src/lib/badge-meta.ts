/** Client-safe badge metadata (no prisma dependency). */
export const BADGE_META: Record<string, { name: string; emoji: string; description: string }> = {
  "ferratovy-pruzkumnik": {
    name: "Ferratový Průzkumník",
    emoji: "\u26F0\uFE0F",
    description: "Check-in na 3+ ferratách",
  },
  lezec: {
    name: "Lezec",
    emoji: "\uD83E\uDDD7",
    description: "Check-in na 3+ lezeckých stěnách",
  },
  "recenzent-sezony": {
    name: "Recenzent sezóny",
    emoji: "\uD83D\uDCDD",
    description: "5+ recenzí za aktuální sezónu",
  },
  pruvodce: {
    name: "Průvodce",
    emoji: "\uD83C\uDF1F",
    description: "Recenze s 5+ hlasy \u201Eužitečné\u201C",
  },
};
