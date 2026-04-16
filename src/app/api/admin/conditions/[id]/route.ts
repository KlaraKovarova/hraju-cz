import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

// DELETE /api/admin/conditions/[id] — permanently delete a condition report.
// UserPhoto rows linked via conditionReportId are detached (SetNull) by schema.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.conditionReport.findUnique({
    where: { id },
    select: { id: true, facilityId: true, userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Report nenalezen." }, { status: 404 });
  }

  await prisma.conditionReport.delete({ where: { id } });

  console.info(
    `[admin-audit] delete conditionReport id=${id} facilityId=${existing.facilityId} userId=${existing.userId}`
  );

  return NextResponse.json({ success: true });
}
