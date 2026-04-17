import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

// PATCH /api/trip-reports/[id]/hide — admin-only. Sets isHidden=true (or false
// when { unhide: true } body is provided).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminFromRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Neautorizováno." }, { status: 401 });
  }

  const { id } = await params;
  let body: { unhide?: boolean } = {};
  try {
    body = (await request.json()) as { unhide?: boolean };
  } catch {
    // empty body is fine — defaults to hide
  }

  const report = await prisma.tripReport.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!report) {
    return NextResponse.json({ error: "Záznam nenalezen." }, { status: 404 });
  }

  const updated = await prisma.tripReport.update({
    where: { id },
    data: { isHidden: !body.unhide },
    select: { id: true, isHidden: true },
  });

  return NextResponse.json(updated);
}
