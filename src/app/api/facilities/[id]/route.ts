import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        location: true,
        sports: { include: { sport: true } },
        amenities: { include: { amenity: true } },
        contacts: true,
        images: { orderBy: { order: "asc" } },
      },
    });
    if (!facility || !facility.isActive) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(facility);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      name, description, address, postalCode, city, region,
      lat, lng, courtsLanes, pricing, openingHours, website, bookingUrl,
      isActive, isClaimed, isPremium, isPromo, amenityIds,
    } = body;

    let locationId: string | undefined;
    if (city) {
      const regionVal = region ?? null;
      let location = await prisma.location.findFirst({
        where: { city, region: regionVal },
      });
      if (!location) {
        location = await prisma.location.create({
          data: { city, region: regionVal },
        });
      }
      locationId = location.id;
    }

    const facility = await prisma.facility.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(postalCode !== undefined && { postalCode }),
        ...(locationId && { locationId }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
        ...(courtsLanes !== undefined && { courtsLanes }),
        ...(pricing !== undefined && { pricing }),
        ...(openingHours !== undefined && { openingHours }),
        ...(website !== undefined && { website }),
        ...(bookingUrl !== undefined && { bookingUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(isClaimed !== undefined && { isClaimed }),
        ...(isPremium !== undefined && { isPremium }),
        ...(isPromo !== undefined && { isPromo }),
      },
      include: { location: true, sports: { include: { sport: true } }, amenities: { include: { amenity: true } } },
    });

    // Sync amenities if provided
    if (Array.isArray(amenityIds)) {
      const current = await prisma.facilityAmenity.findMany({
        where: { facilityId: id },
        select: { amenityId: true },
      });
      const currentIds = new Set(current.map((a) => a.amenityId));
      const desiredIds = new Set(amenityIds as string[]);

      const toAdd = [...desiredIds].filter((aid) => !currentIds.has(aid));
      const toRemove = [...currentIds].filter((aid) => !desiredIds.has(aid));

      await Promise.all([
        ...toAdd.map((amenityId) =>
          prisma.facilityAmenity.create({ data: { facilityId: id, amenityId } })
        ),
        ...(toRemove.length > 0
          ? [
              prisma.facilityAmenity.deleteMany({
                where: { facilityId: id, amenityId: { in: toRemove } },
              }),
            ]
          : []),
      ]);
    }

    return NextResponse.json(facility);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await prisma.facility.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
