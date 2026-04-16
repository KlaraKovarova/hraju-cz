import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — increment daily view count for a facility.
// Called from the TrackPageView client component so the server page stays cacheable (ISR).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: facilityId } = await params;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.facilityView.upsert({
      where: { facilityId_date: { facilityId, date: today } },
      update: { views: { increment: 1 } },
      create: { facilityId, date: today, views: 1 },
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Non-critical — view tracking should never fail a request.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
