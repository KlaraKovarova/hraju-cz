import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import { getAdminSession } from "@/lib/admin-auth";

// DELETE /api/trip-reports/[id] — author or admin can delete.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getUserSession();
  const isAdmin = await getAdminSession();

  if (!session && !isAdmin) {
    return NextResponse.json({ error: "Neautorizováno." }, { status: 401 });
  }

  const report = await prisma.tripReport.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!report) {
    return NextResponse.json({ error: "Záznam nenalezen." }, { status: 404 });
  }

  if (!isAdmin && session?.userId !== report.userId) {
    return NextResponse.json({ error: "Nemáte oprávnění." }, { status: 403 });
  }

  // Detach photos rather than deleting them — users keep their photo gallery
  // even when a linked report is removed. (Same pattern as SetNull on the FK.)
  await prisma.tripReport.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
