import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

// POST /api/admin/conditions/[id]/unhide — restore a previously hidden condition report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.conditionReport.findUnique({
    where: { id },
    select: { id: true, isHidden: true, facilityId: true, userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Report nenalezen." }, { status: 404 });
  }

  await prisma.conditionReport.update({
    where: { id },
    data: { isHidden: false },
  });

  console.info(
    `[admin-audit] unhide conditionReport id=${id} facilityId=${existing.facilityId} userId=${existing.userId}`
  );

  return NextResponse.json({ success: true });
}
