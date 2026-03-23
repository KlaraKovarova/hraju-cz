import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

// POST — create check-in (idempotent)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: facilityId } = await params;

  try {
    // Rate limit: max 20 check-ins per user per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await prisma.visit.count({
      where: {
        userId: session.userId,
        createdAt: { gte: todayStart },
      },
    });

    if (todayCount >= 20) {
      return NextResponse.json(
        { error: "Dosáhli jste denního limitu check-inů (20)." },
        { status: 429 }
      );
    }

    // Check facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    // Parse optional note
    let note: string | null = null;
    try {
      const body = await request.json();
      if (body.note && typeof body.note === "string") {
        note = body.note.slice(0, 280);
      }
    } catch {
      // No body or invalid JSON — that's fine
    }

    // Upsert: idempotent, one check-in per user per facility
    const visit = await prisma.visit.upsert({
      where: {
        userId_facilityId: {
          userId: session.userId,
          facilityId,
        },
      },
      update: { note },
      create: {
        userId: session.userId,
        facilityId,
        note,
      },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// DELETE — remove check-in
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
    await prisma.visit.delete({
      where: {
        userId_facilityId: {
          userId: session.userId,
          facilityId,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// GET — check if current user has visited + total visit count
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: facilityId } = await params;

  try {
    const [count, session] = await Promise.all([
      prisma.visit.count({ where: { facilityId } }),
      getUserSession(),
    ]);

    let hasVisited = false;
    if (session) {
      const existing = await prisma.visit.findUnique({
        where: {
          userId_facilityId: {
            userId: session.userId,
            facilityId,
          },
        },
        select: { id: true },
      });
      hasVisited = !!existing;
    }

    return NextResponse.json({ count, hasVisited });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
