import { prisma } from "./prisma";

export type ExpertiseLabel = {
  name: string;
  level: "znalec" | "expert";
};

const SPORT_NAMES: Record<string, { znalec: string; expert: string }> = {
  ferraty: { znalec: "Znalec ferrat", expert: "Expert na ferraty" },
  lezeni: { znalec: "Znalec lezení", expert: "Expert na lezení" },
  tenis: { znalec: "Znalec tenisu", expert: "Expert na tenis" },
  badminton: { znalec: "Znalec badmintonu", expert: "Expert na badminton" },
  squash: { znalec: "Znalec squashe", expert: "Expert na squash" },
  plavani: { znalec: "Znalec plavání", expert: "Expert na plavání" },
  fitness: { znalec: "Znalec fitness", expert: "Expert na fitness" },
};

function labelFromCount(sportSlug: string, count: number): ExpertiseLabel | null {
  const names = SPORT_NAMES[sportSlug];
  if (!names) return null;
  if (count >= 10) return { name: names.expert, level: "expert" };
  if (count >= 3) return { name: names.znalec, level: "znalec" };
  return null;
}

/**
 * Batch-compute expertise labels for multiple users in a single sport.
 * Returns a Map from userId to their expertise label (if any).
 */
export async function batchExpertiseForSport(
  userIds: string[],
  sportSlug: string,
): Promise<Map<string, ExpertiseLabel>> {
  if (userIds.length === 0 || !SPORT_NAMES[sportSlug]) return new Map();

  const counts = await prisma.review.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      isApproved: true,
      facility: { sports: { some: { sport: { slug: sportSlug } } } },
    },
    _count: { id: true },
  });

  const result = new Map<string, ExpertiseLabel>();
  for (const row of counts) {
    if (!row.userId) continue;
    const label = labelFromCount(sportSlug, row._count.id);
    if (label) result.set(row.userId, label);
  }
  return result;
}

/**
 * Compute all expertise labels for a single user across all sports.
 */
export async function getUserExpertise(userId: string): Promise<ExpertiseLabel[]> {
  const counts = await prisma.review.groupBy({
    by: ["facilityId"],
    where: { userId, isApproved: true },
    _count: { id: true },
  });

  if (counts.length === 0) return [];

  // Get sport slugs for all reviewed facilities
  const facilityIds = counts.map((c) => c.facilityId);
  const facilitySports = await prisma.facilitySport.findMany({
    where: { facilityId: { in: facilityIds } },
    select: { facilityId: true, sport: { select: { slug: true } } },
  });

  // Count reviews per sport
  const reviewsByFacility = new Map(counts.map((c) => [c.facilityId, c._count.id]));
  const sportCounts = new Map<string, number>();
  for (const fs of facilitySports) {
    const slug = fs.sport.slug;
    const prev = sportCounts.get(slug) ?? 0;
    sportCounts.set(slug, prev + (reviewsByFacility.get(fs.facilityId) ?? 0));
  }

  const labels: ExpertiseLabel[] = [];
  for (const [slug, count] of sportCounts) {
    const label = labelFromCount(slug, count);
    if (label) labels.push(label);
  }
  return labels;
}
