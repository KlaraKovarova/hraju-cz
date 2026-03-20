import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOwnerSession } from "@/lib/owner-auth";

// PUT /api/owner/amenities — replace all facility amenities
export async function PUT(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amenityIds } = body as { amenityIds: string[] };

    if (!Array.isArray(amenityIds)) {
      return NextResponse.json({ error: "amenityIds must be an array" }, { status: 400 });
    }

    // Validate that all amenity IDs exist
    if (amenityIds.length > 0) {
      const existingCount = await prisma.amenity.count({
        where: { id: { in: amenityIds } },
      });
      if (existingCount !== amenityIds.length) {
        return NextResponse.json({ error: "Invalid amenity IDs" }, { status: 400 });
      }
    }

    // Replace: delete all existing, create new ones
    await prisma.facilityAmenity.deleteMany({
      where: { facilityId: session.facilityId },
    });

    if (amenityIds.length > 0) {
      await prisma.facilityAmenity.createMany({
        data: amenityIds.map((amenityId) => ({
          facilityId: session.facilityId,
          amenityId,
        })),
      });
    }

    // Revalidate facility pages
    const facility = await prisma.facility.findUnique({
      where: { id: session.facilityId },
      select: { slug: true, sports: { select: { sport: { select: { slug: true } } } } },
    });
    if (facility) {
      for (const s of facility.sports) {
        revalidatePath(`/sport/${s.sport.slug}/${facility.slug}`);
        revalidatePath(`/sport/${s.sport.slug}`);
      }
      revalidatePath("/");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update amenities:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
