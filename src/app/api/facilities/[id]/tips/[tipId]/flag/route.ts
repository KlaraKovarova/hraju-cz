import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/facilities/[id]/tips/[tipId]/flag — flag a tip as inappropriate
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; tipId: string }> }
) {
  const { tipId } = await params;

  try {
    await prisma.facilityTip.update({
      where: { id: tipId },
      data: { flagged: true },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Tip nenalezen." }, { status: 404 });
  }
}
