import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTOS_PER_REVIEW = 3;
const MAX_DAILY_UPLOADS = 15;

// POST /api/upload/photo — upload a user photo for a review or check-in
export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Musíte být přihlášeni." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const facilityId = formData.get("facilityId") as string | null;
    const context = formData.get("context") as string | null; // "review" or "visit"

    if (!file) {
      return NextResponse.json({ error: "Nebyl vybrán žádný soubor." }, { status: 400 });
    }

    if (!facilityId) {
      return NextResponse.json({ error: "Chybí facilityId." }, { status: 400 });
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

    // Check facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true },
    });
    if (!facility) {
      return NextResponse.json({ error: "Sportoviště nenalezeno." }, { status: 404 });
    }

    // Daily upload rate limit
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dailyCount = await prisma.userPhoto.count({
      where: { userId: session.userId, createdAt: { gte: dayStart } },
    });
    if (dailyCount >= MAX_DAILY_UPLOADS) {
      return NextResponse.json(
        { error: "Překročen denní limit nahrávání fotek." },
        { status: 429 }
      );
    }

    // For "review" and "condition" contexts, limit the number of unlinked photos
    // the user has pending attachment to a new record for this facility.
    if (context === "review" || context === "condition") {
      const existingPhotos = await prisma.userPhoto.count({
        where: {
          userId: session.userId,
          facilityId,
          reviewId: null,
          visitId: null,
          conditionReportId: null,
        },
      });
      if (existingPhotos >= MAX_PHOTOS_PER_REVIEW) {
        return NextResponse.json(
          { error: `Maximum je ${MAX_PHOTOS_PER_REVIEW} fotky.` },
          { status: 400 }
        );
      }
    }

    // Save file
    const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "user-photos", facilityId);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/user-photos/${facilityId}/${filename}`;

    const photo = await prisma.userPhoto.create({
      data: {
        userId: session.userId,
        facilityId,
        url,
        alt: null,
      },
    });

    return NextResponse.json(
      { id: photo.id, url: photo.url },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to upload user photo:", error);
    return NextResponse.json({ error: "Nahrávání selhalo." }, { status: 500 });
  }
}
