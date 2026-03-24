import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/facilities/[id]/photos — get all visible user photos for a facility
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: facilityId } = await params;

  const photos = await prisma.userPhoto.findMany({
    where: {
      facilityId,
      isHidden: false,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      url: true,
      alt: true,
      createdAt: true,
      user: { select: { name: true, id: true } },
      review: { select: { id: true, title: true } },
      visit: { select: { id: true } },
    },
  });

  return NextResponse.json({ photos });
}
