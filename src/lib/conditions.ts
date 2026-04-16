// Shared constants and helpers for the ConditionReport feature
// Keep server + client in sync on ratings, limits, visibility windows.

export const ALLOWED_CONDITION_RATINGS = ["excellent", "good", "poor", "closed"] as const;
export type ConditionRating = (typeof ALLOWED_CONDITION_RATINGS)[number];

export const CONDITION_COMMENT_MAX_LENGTH = 500;
export const CONDITION_FRESH_DAYS = 7;       // how many days a report counts as "fresh"
export const CONDITION_VISIBILITY_DAYS = 30; // reports older than this are hidden from public lists
export const CONDITION_RATE_LIMIT_HOURS = 24;
export const CONDITION_AGGREGATE_MIN = 3;    // min fresh reports before we emit aggregateRating

export const CONDITION_RATING_META: Record<
  ConditionRating,
  { labelCs: string; emoji: string; color: string; schemaValue: number }
> = {
  excellent: { labelCs: "Skvělé", emoji: "🟢", color: "emerald", schemaValue: 5 },
  good: { labelCs: "Dobré", emoji: "🟡", color: "amber", schemaValue: 4 },
  poor: { labelCs: "Horší", emoji: "🟠", color: "orange", schemaValue: 2 },
  closed: { labelCs: "Uzavřeno", emoji: "🔴", color: "rose", schemaValue: 1 },
};

export function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function isFreshCondition(createdAt: Date, days = CONDITION_FRESH_DAYS): boolean {
  return createdAt.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}
