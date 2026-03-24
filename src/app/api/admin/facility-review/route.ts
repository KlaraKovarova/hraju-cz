import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/admin/facility-review — list facilities with quality flags
export async function GET(request: NextRequest) {
  const admin = await verifyAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const issue = searchParams.get("issue"); // NO_COORDS, NO_CONTACTS, NO_PHONE, NO_WEB, NO_HOURS, NO_ZIP, NO_IMAGES, NO_DESC
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const search = searchParams.get("search")?.trim();

  try {
    const where: Record<string, unknown> = { isActive: true };

    if (sport) {
      where.sports = { some: { sport: { slug: sport } } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { location: { city: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Build issue-specific filters
    if (issue) {
      switch (issue) {
        case "NO_COORDS":
          where.lat = null;
          break;
        case "NO_CONTACTS":
          where.contacts = { none: {} };
          break;
        case "NO_PHONE":
          where.NOT = { contacts: { some: { type: "PHONE" } } };
          break;
        case "NO_WEB":
          where.website = null;
          break;
        case "NO_HOURS":
          where.openingHours = null;
          break;
        case "NO_ZIP":
          where.postalCode = null;
          break;
        case "NO_IMAGES":
          where.images = { none: {} };
          break;
        case "NO_DESC":
          where.description = null;
          break;
      }
    }

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        include: {
          location: { select: { city: true, region: true } },
          sports: { include: { sport: { select: { nameCs: true, slug: true } } } },
          contacts: { select: { type: true, value: true } },
          images: { select: { id: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.facility.count({ where }),
    ]);

    const results = facilities.map((f) => {
      const flags: string[] = [];
      if (!f.lat || !f.lng) flags.push("NO_COORDS");
      if (f.contacts.length === 0) flags.push("NO_CONTACTS");
      else if (!f.contacts.some((c) => c.type === "PHONE")) flags.push("NO_PHONE");
      if (!f.description) flags.push("NO_DESC");
      if (!f.website) flags.push("NO_WEB");
      if (!f.openingHours) flags.push("NO_HOURS");
      if (!f.postalCode) flags.push("NO_ZIP");
      if (f.images.length === 0) flags.push("NO_IMAGES");

      return {
        id: f.id,
        name: f.name,
        slug: f.slug,
        description: f.description ? f.description.slice(0, 200) : null,
        city: f.location.city,
        region: f.location.region,
        address: f.address,
        sports: f.sports.map((s) => s.sport.nameCs),
        sportSlugs: f.sports.map((s) => s.sport.slug),
        hasPhone: f.contacts.some((c) => c.type === "PHONE"),
        hasEmail: f.contacts.some((c) => c.type === "EMAIL"),
        hasWebsite: !!f.website,
        hasCoords: !!(f.lat && f.lng),
        hasDescription: !!f.description,
        hasHours: !!f.openingHours,
        hasImages: f.images.length > 0,
        isClaimed: f.isClaimed,
        isPremium: f.isPremium,
        flags,
        website: f.website,
        listingUrl: f.sports[0]
          ? `/${f.sports[0].sport.slug}/${f.slug}`
          : `/${f.slug}`,
      };
    });

    return NextResponse.json({
      facilities: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("facility-review error:", e);
    return NextResponse.json({ error: "Databáze je nedostupná." }, { status: 503 });
  }
}
