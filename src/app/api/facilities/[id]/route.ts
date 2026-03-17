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
    if (!facility) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      lat, lng, courtsLanes, pricing, openingHours, website,
      isActive, isClaimed, isPremium,
    } = body;

    let locationId: string | undefined;
    if (city) {
      const location = await prisma.location.upsert({
        where: { city_region: { city, region: region ?? null } },
        create: { city, region: region ?? null },
        update: {},
      });
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
        ...(isActive !== undefined && { isActive }),
        ...(isClaimed !== undefined && { isClaimed }),
        ...(isPremium !== undefined && { isPremium }),
      },
      include: { location: true, sports: { include: { sport: true } } },
    });
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
