import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      select: { helpful: true },
    });
    return NextResponse.json({ helpful: tip.helpful });
  } catch {
    return NextResponse.json({ error: "Tip nenalezen." }, { status: 404 });
  }
}
