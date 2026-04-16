/**
 * SIL-666 — helpers for "Foto týdne" weekly photo contest.
 * Uses ISO 8601 year-week strings (e.g. "2026-W16").
 *
 * The cron runs Monday 09:00 UTC and awards the winner for the week that
 * just ended — so the "current week" during voting is the one that ends
 * next Sunday, and the "previous week" is the one the cron tallies.
 */

/** Max age of a photo (in days) for it to be eligible to receive votes. */
export const PHOTO_VOTE_ELIGIBILITY_DAYS = 14;

/**
 * Compute ISO year-week key for a given date (UTC-aware). Returns e.g. "2026-W16".
 * Follows ISO 8601: week 1 is the week containing the first Thursday of the year.
 */
export function isoWeekKey(date: Date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // Thursday of the current ISO week determines the year.
  const dayNum = d.getUTCDay() || 7; // 1 (Mon) .. 7 (Sun)
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Current ISO year-week key. */
export function currentWeekKey(now: Date = new Date()): string {
  return isoWeekKey(now);
}

/**
 * Previous ISO year-week key (the week we tally when the Monday cron fires).
 * We subtract 3 days from "now" on Monday ~09:00 UTC to land firmly inside
 * the previous ISO week (Friday), regardless of year boundaries.
 */
export function previousWeekKey(now: Date = new Date()): string {
  const d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  return isoWeekKey(d);
}

/** Return true if a photo's createdAt is within the eligibility window. */
export function isPhotoEligibleForVote(createdAt: Date, now: Date = new Date()): boolean {
  const cutoff = now.getTime() - PHOTO_VOTE_ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000;
  return createdAt.getTime() >= cutoff;
}

/**
 * Return [startUtc, endUtc) for the ISO week containing the given date.
 * Monday 00:00:00 UTC start, next Monday 00:00:00 UTC end.
 */
export function isoWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // 1..7 (Mon..Sun)
  d.setUTCDate(d.getUTCDate() - (dayNum - 1)); // Monday 00:00 UTC
  const start = new Date(d.getTime());
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Format a weekKey as a human-readable Czech range ("14.–20. dubna 2026").
 * Cheap formatter — prefers clarity over i18n heavy lifting.
 */
export function formatWeekKeyCs(weekKey: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return weekKey;
  const year = Number(match[1]);
  const week = Number(match[2]);
  // Monday of that ISO week
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4.getTime() - (jan4Day - 1) * 86_400_000);
  const monday = new Date(mondayOfWeek1.getTime() + (week - 1) * 7 * 86_400_000);
  const sunday = new Date(monday.getTime() + 6 * 86_400_000);
  const months = [
    "ledna", "února", "března", "dubna", "května", "června",
    "července", "srpna", "září", "října", "listopadu", "prosince",
  ];
  const mStart = monday.getUTCMonth();
  const mEnd = sunday.getUTCMonth();
  const dStart = monday.getUTCDate();
  const dEnd = sunday.getUTCDate();
  const yStart = monday.getUTCFullYear();
  const yEnd = sunday.getUTCFullYear();

  if (mStart === mEnd && yStart === yEnd) {
    return `${dStart}.\u2013${dEnd}. ${months[mStart]} ${yStart}`;
  }
  if (yStart === yEnd) {
    return `${dStart}. ${months[mStart]} \u2013 ${dEnd}. ${months[mEnd]} ${yStart}`;
  }
  return `${dStart}. ${months[mStart]} ${yStart} \u2013 ${dEnd}. ${months[mEnd]} ${yEnd}`;
}
