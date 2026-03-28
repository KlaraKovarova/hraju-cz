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
  plavec: {
    name: "Plavec",
    emoji: "\uD83C\uDFCA",
    description: "Check-in na 3+ bazénech",
  },
  golfista: {
    name: "Golfista",
    emoji: "\u26F3",
    description: "Check-in na 3+ golfových hřištích",
  },
  "fitness-guru": {
    name: "Fitness Guru",
    emoji: "\uD83D\uDCAA",
    description: "Check-in v 5+ fitness centrech",
  },
  "recenzent-sezony": {
    name: "Recenzent sezóny",
    emoji: "\uD83D\uDCDD",
    description: "5+ recenzí za aktuální sezónu",
  },
  "hvezdny-recenzent": {
    name: "Hvězdný recenzent",
    emoji: "\u2B50",
    description: "10+ schválených recenzí",
  },
  pruvodce: {
    name: "Průvodce",
    emoji: "\uD83C\uDF1F",
    description: "Recenze s 5+ hlasy \u201Eužitečné\u201C",
  },
  pomocnik: {
    name: "Pomocník",
    emoji: "\uD83E\uDD1D",
    description: "Celkem 10+ hlasů \u201Eužitečné\u201C na vašich recenzích",
  },
  "tydenni-serie": {
    name: "Týdenní série",
    emoji: "\uD83D\uDD25",
    description: "Check-in ve 3 různé dny v jednom týdnu",
  },
  "aktivni-mesic": {
    name: "Aktivní měsíc",
    emoji: "\uD83D\uDCC5",
    description: "10+ check-inů nebo recenzí za jeden měsíc",
  },
  "jarni-pruzkumnik": {
    name: "Jarní průzkumník",
    emoji: "\uD83C\uDF38",
    description: "5+ různých sportovišť navštívených na jaře 2026",
  },
};
