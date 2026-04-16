import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/facilities/[id]/conditions/[reportId]/helpful — increment helpful count
// Matches the simple unauthenticated pattern used for review/tip helpful votes;
// client-side throttling via localStorage is handled in the component.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { reportId } = await params;

  try {
    const report = await prisma.conditionReport.update({
      where: { id: reportId, isHidden: false },
      data: { helpful: { increment: 1 } },
      select: { helpful: true },
    });
    return NextResponse.json({ helpful: report.helpful });
  } catch {
    return NextResponse.json({ error: "Report nenalezen." }, { status: 404 });
  }
}
