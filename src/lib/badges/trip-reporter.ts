import { prisma } from "@/lib/prisma";

// "Trip reporter" tier system — three tiers unlocked by total non-hidden trip
// reports (SIL-678). Reuses UserBadge the same way SIL-659 Místní průvodce
// does; tiers are retained once earned (unique [userId, badgeSlug] on
// UserBadge). Display tier = highest earned slug.

export type TripReporterTier = "bronze" | "silver" | "gold";

export const TRIP_REPORTER_BADGE_SLUGS: Record<TripReporterTier, string> = {
  bronze: "trip-reporter-bronze",
  silver: "trip-reporter-silver",
  gold: "trip-reporter-gold",
};

export const TRIP_REPORTER_TIER_LABELS: Record<TripReporterTier, string> = {
  bronze: "Aktivní lezec",
  silver: "Závodník",
  gold: "Legenda",
};

export const TRIP_REPORTER_TIER_EMOJI = "🧗‍♂️";

export const TRIP_REPORTER_THRESHOLDS: Record<TripReporterTier, { reports: number }> = {
  bronze: { reports: 5 },
  silver: { reports: 20 },
  gold: { reports: 50 },
};

export async function countUserTripReports(userId: string): Promise<number> {
  return prisma.tripReport.count({
    where: { userId, isHidden: false },
  });
}

export function tripReporterTierQualifies(
  tier: TripReporterTier,
  totalReports: number
): boolean {
  return totalReports >= TRIP_REPORTER_THRESHOLDS[tier].reports;
}
