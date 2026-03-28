import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBadgesByCategory } from "@/lib/challenges";

// POST /api/facilities/[id]/tips/[tipId]/helpful — increment helpful count
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; tipId: string }> }
) {
  const { tipId } = await params;

  try {
    const tip = await prisma.facilityTip.update({
      where: { id: tipId, isApproved: true },
      data: { helpful: { increment: 1 } },
      select: { helpful: true, userId: true },
    });

    // Check community badges for tip author (fire-and-forget)
    if (tip.userId) {
      checkBadgesByCategory(tip.userId, "community").catch(() => {});
    }

    return NextResponse.json({ helpful: tip.helpful });
  } catch {
    return NextResponse.json({ error: "Tip nenalezen." }, { status: 404 });
  }
}
