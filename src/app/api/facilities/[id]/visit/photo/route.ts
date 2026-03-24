import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

// POST — link a photo to user's check-in at this facility
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: facilityId } = await params;

  let body: { photoId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { photoId } = body;
  if (!photoId) {
    return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
  }

  // Find user's visit
  const visit = await prisma.visit.findUnique({
    where: {
      userId_facilityId: {
        userId: session.userId,
        facilityId,
      },
    },
  });

  if (!visit) {
    return NextResponse.json({ error: "No check-in found" }, { status: 404 });
  }

  // Link photo to the visit
  const updated = await prisma.userPhoto.updateMany({
    where: {
      id: photoId,
      userId: session.userId,
      facilityId,
      visitId: null,
    },
    data: { visitId: visit.id },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Photo not found or already linked" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
