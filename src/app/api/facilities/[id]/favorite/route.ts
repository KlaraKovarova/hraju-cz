import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

// POST — toggle favorite on
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: facilityId } = await params;

  try {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    await prisma.favorite.upsert({
      where: {
        userId_facilityId: {
          userId: session.userId,
          facilityId,
        },
      },
      update: {},
      create: {
        userId: session.userId,
        facilityId,
      },
    });

    // Update denormalized count
    const count = await prisma.favorite.count({ where: { facilityId } });
    await prisma.facility.update({
      where: { id: facilityId },
      data: { favoriteCount: count },
    });

    return NextResponse.json({ isFavorited: true, count }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// DELETE — remove favorite
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: facilityId } = await params;

  try {
    await prisma.favorite.delete({
      where: {
        userId_facilityId: {
          userId: session.userId,
          facilityId,
        },
      },
    });

    // Update denormalized count
    const count = await prisma.favorite.count({ where: { facilityId } });
    await prisma.facility.update({
      where: { id: facilityId },
      data: { favoriteCount: count },
    });

    return NextResponse.json({ isFavorited: false, count });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// GET — check if current user has favorited + total count
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: facilityId } = await params;

  try {
    const [count, session] = await Promise.all([
      prisma.favorite.count({ where: { facilityId } }),
      getUserSession(),
    ]);

    let isFavorited = false;
    if (session) {
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_facilityId: {
            userId: session.userId,
            facilityId,
          },
        },
        select: { id: true },
      });
      isFavorited = !!existing;
    }

    return NextResponse.json({ count, isFavorited });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
