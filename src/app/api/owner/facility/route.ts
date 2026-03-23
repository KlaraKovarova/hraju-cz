import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOwnerSession } from "@/lib/owner-auth";

// Get the owner's facility data
export async function GET() {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const facility = await prisma.facility.findUnique({
      where: { id: session.facilityId },
      include: {
        location: true,
        sports: { include: { sport: { select: { slug: true, nameCs: true } } } },
        contacts: true,
        images: { orderBy: { order: "asc" } },
        amenities: { include: { amenity: true } },
      },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    return NextResponse.json(facility);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

// Owner updates their facility
export async function PATCH(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name, description, address, postalCode,
      pricing, openingHours, website, bookingUrl,
      phone, email: contactEmail,
    } = body;

    // Update facility fields
    const facility = await prisma.facility.update({
      where: { id: session.facilityId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(postalCode !== undefined && { postalCode }),
        ...(pricing !== undefined && { pricing }),
        ...(openingHours !== undefined && { openingHours }),
        ...(website !== undefined && { website }),
        ...(bookingUrl !== undefined && { bookingUrl }),
      },
    });

    // Update phone contact if provided
    if (phone !== undefined) {
      const existingPhone = await prisma.contact.findFirst({
        where: { facilityId: session.facilityId, type: "PHONE", isPrimary: true },
      });
      if (existingPhone) {
        if (phone) {
          await prisma.contact.update({
            where: { id: existingPhone.id },
            data: { value: phone },
          });
        } else {
          await prisma.contact.delete({ where: { id: existingPhone.id } });
        }
      } else if (phone) {
        await prisma.contact.create({
          data: { facilityId: session.facilityId, type: "PHONE", value: phone, isPrimary: true },
        });
      }
    }

    // Update email contact if provided
    if (contactEmail !== undefined) {
      const existingEmail = await prisma.contact.findFirst({
        where: { facilityId: session.facilityId, type: "EMAIL", isPrimary: true },
      });
      if (existingEmail) {
        if (contactEmail) {
          await prisma.contact.update({
            where: { id: existingEmail.id },
            data: { value: contactEmail },
          });
        } else {
          await prisma.contact.delete({ where: { id: existingEmail.id } });
        }
      } else if (contactEmail) {
        await prisma.contact.create({
          data: { facilityId: session.facilityId, type: "EMAIL", value: contactEmail, isPrimary: true },
        });
      }
    }

    // Revalidate cached pages for this facility
    const updatedFacility = await prisma.facility.findUnique({
      where: { id: session.facilityId },
      select: { slug: true, sports: { select: { sport: { select: { slug: true } } } } },
    });
    if (updatedFacility) {
      for (const s of updatedFacility.sports) {
        revalidatePath(`/sport/${s.sport.slug}/${updatedFacility.slug}`);
        revalidatePath(`/sport/${s.sport.slug}`);
      }
      revalidatePath("/");
    }

    return NextResponse.json(facility);
  } catch (error) {
    console.error("Failed to update facility:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
