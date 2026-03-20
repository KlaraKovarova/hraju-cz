import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getOwnerSession } from "@/lib/owner-auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// POST /api/owner/photos — upload a facility image
export async function POST(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Nepovolený formát. Povoleny jsou JPEG, PNG a WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Soubor je příliš velký. Maximum je 5 MB." },
        { status: 400 }
      );
    }

    // Check current image count
    const imageCount = await prisma.facilityImage.count({
      where: { facilityId: session.facilityId },
    });

    if (imageCount >= MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum je ${MAX_IMAGES} fotek.` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "facilities", session.facilityId);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/facilities/${session.facilityId}/${filename}`;

    // Set as primary if it's the first image
    const isPrimary = imageCount === 0;

    const image = await prisma.facilityImage.create({
      data: {
        facilityId: session.facilityId,
        url,
        alt: null,
        isPrimary,
        order: imageCount,
      },
    });

    // Revalidate facility pages
    await revalidateFacilityPages(session.facilityId);

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Failed to upload photo:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
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
