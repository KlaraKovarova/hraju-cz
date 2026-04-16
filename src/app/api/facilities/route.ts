import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const city = searchParams.get("city");
  const slug = searchParams.get("slug");
  const search = searchParams.get("search");
  const limitParam = searchParams.get("limit");

  // Cap maximum results to prevent bandwidth abuse / data dumps (SIL-646)
  const MAX_LIMIT = 100;
  const DEFAULT_LIMIT = 50;
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;
  const take = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(MAX_LIMIT, parsedLimit)
    : DEFAULT_LIMIT;

  try {
    // Explicit allowlist — never leak Stripe/admin fields on the public endpoint (SIL-643)
    const facilities = await prisma.facility.findMany({
      where: {
        isActive: true,
        ...(slug ? { slug } : {}),
        ...(sport ? { sports: { some: { sport: { slug: sport } } } } : {}),
        ...(city ? { location: { city: { contains: city } } } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        postalCode: true,
        lat: true,
        lng: true,
        courtsLanes: true,
        pricing: true,
        openingHours: true,
        website: true,
        bookingUrl: true,
        isClaimed: true,
        isPremium: true,
        isPromo: true,
        averageRating: true,
        reviewCount: true,
        tipCount: true,
        favoriteCount: true,
        createdAt: true,
        updatedAt: true,
        location: { select: { city: true, region: true } },
        sports: { select: { sport: { select: { slug: true, nameCs: true } } } },
        contacts: { select: { id: true, type: true, value: true, label: true, isPrimary: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { id: true, url: true, alt: true, isPrimary: true, order: true },
        },
      },
      orderBy: [{ isPremium: "desc" }, { name: "asc" }],
      take,
    });
    return NextResponse.json(facilities);
  } catch (error) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name, slug, description, address, postalCode, city, region,
      lat, lng, courtsLanes, pricing, openingHours, website, bookingUrl,
      sportSlugs = [],
      amenityIds = [],
    } = body;

    if (!name || !slug || !address || !city) {
      return NextResponse.json({ error: "name, slug, address, city required" }, { status: 400 });
    }

    const regionVal = region ?? null;
    let location = await prisma.location.findFirst({
      where: { city, region: regionVal },
    });
    if (!location) {
      location = await prisma.location.create({
        data: { city, region: regionVal },
      });
    }

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
        bookingUrl: bookingUrl ?? null,
        sports: {
          create: await Promise.all(
            (sportSlugs as string[]).map(async (sportSlug: string) => {
              const sport = await prisma.sport.findUnique({ where: { slug: sportSlug } });
              return { sportId: sport!.id };
            })
          ),
        },
        ...((amenityIds as string[]).length > 0 && {
          amenities: {
            create: (amenityIds as string[]).map((amenityId: string) => ({ amenityId })),
          },
        }),
      },
      include: { location: true, sports: { include: { sport: true } }, amenities: { include: { amenity: true } } },
    });

    return NextResponse.json(facility, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create facility" }, { status: 500 });
  }
}
