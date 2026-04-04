import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";
import { getRelatedFacilities } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ suggestions: [] });
  }

  const { id: facilityId } = await params;

  try {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: {
        slug: true,
        lat: true,
        lng: true,
        location: { select: { city: true, region: true } },
        sports: { select: { sport: { select: { slug: true } } } },
      },
    });

    if (!facility || !facility.sports[0]) {
      return NextResponse.json({ suggestions: [] });
    }

    const sportSlug = facility.sports[0].sport.slug;

    // Get user's visited facility IDs
    const visits = await prisma.visit.findMany({
      where: { userId: session.userId },
      select: { facilityId: true },
    });
    const visitedIds = new Set(visits.map((v) => v.facilityId));

    // Get nearby facilities (request extra to account for filtering out visited)
    const { facilities } = await getRelatedFacilities(
      sportSlug,
      facility.location.city,
      facility.location.region,
      facility.slug,
      10,
      facility.lat,
      facility.lng,
    );

    // Filter out visited facilities, take top 3
    const suggestions = facilities
      .filter((f) => !visitedIds.has(f.id))
      .slice(0, 3)
      .map((f) => ({
        name: f.name,
        slug: f.slug,
        sportSlug,
        city: f.location.city,
        distanceKm: f.distanceKm,
      }));

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
