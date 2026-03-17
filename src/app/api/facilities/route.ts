import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const city = searchParams.get("city");

  try {
    const facilities = await prisma.facility.findMany({
      where: {
        ...(sport ? { sports: { some: { sport: { slug: sport } } } } : {}),
        ...(city ? { location: { city: { contains: city } } } : {}),
      },
      include: {
        location: { select: { city: true, region: true } },
        sports: { include: { sport: { select: { slug: true, nameCs: true } } } },
        contacts: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: [{ isPremium: "desc" }, { name: "asc" }],
    });
    return NextResponse.json(facilities);
  } catch (error) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, slug, description, address, postalCode, city, region,
      lat, lng, courtsLanes, pricing, openingHours, website,
      sportSlugs = [],
    } = body;

    if (!name || !slug || !address || !city) {
      return NextResponse.json({ error: "name, slug, address, city required" }, { status: 400 });
    }

    const location = await prisma.location.upsert({
      where: { city_region: { city, region: region ?? null } },
      create: { city, region: region ?? null },
      update: {},
    });

    const facility = await prisma.facility.create({
      data: {
        name,
        slug,
        description: description ?? null,
        address,
        postalCode: postalCode ?? null,
        locationId: location.id,
        lat: lat ?? null,
        lng: lng ?? null,
        courtsLanes: courtsLanes ?? null,
        pricing: pricing ?? null,
        openingHours: openingHours ?? null,
        website: website ?? null,
        sports: {
          create: await Promise.all(
            (sportSlugs as string[]).map(async (sportSlug: string) => {
              const sport = await prisma.sport.findUnique({ where: { slug: sportSlug } });
              return { sportId: sport!.id };
            })
          ),
        },
      },
      include: { location: true, sports: { include: { sport: true } } },
    });

    return NextResponse.json(facility, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create facility" }, { status: 500 });
  }
}
