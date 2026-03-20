import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getOwnerSession } from "@/lib/owner-auth";

// DELETE /api/owner/photos/[imageId] — delete a facility image
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await params;

  try {
    const image = await prisma.facilityImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.facilityId !== session.facilityId) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from filesystem
    if (image.url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", image.url);
      try {
        await unlink(filePath);
      } catch {
        // File may not exist, continue with DB deletion
      }
    }

    await prisma.facilityImage.delete({ where: { id: imageId } });

    // If this was the primary image, set the next one as primary
    if (image.isPrimary) {
      const next = await prisma.facilityImage.findFirst({
        where: { facilityId: session.facilityId },
        orderBy: { order: "asc" },
      });
      if (next) {
        await prisma.facilityImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    await revalidateFacilityPages(session.facilityId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete photo:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

// PATCH /api/owner/photos/[imageId] — update isPrimary or order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await params;

  try {
    const body = await request.json();
    const { isPrimary } = body;

    const image = await prisma.facilityImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.facilityId !== session.facilityId) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (isPrimary === true) {
      // Unset current primary
      await prisma.facilityImage.updateMany({
        where: { facilityId: session.facilityId, isPrimary: true },
        data: { isPrimary: false },
      });
      // Set this as primary
      await prisma.facilityImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    }

    await revalidateFacilityPages(session.facilityId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update photo:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

async function revalidateFacilityPages(facilityId: string) {
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { slug: true, sports: { select: { sport: { select: { slug: true } } } } },
  });
  if (facility) {
    for (const s of facility.sports) {
      revalidatePath(`/sport/${s.sport.slug}/${facility.slug}`);
      revalidatePath(`/sport/${s.sport.slug}`);
    }
    revalidatePath("/");
  }
}
