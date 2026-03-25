import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/tips/[id] — approve, reject, or revoke a tip
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "approve" && action !== "reject" && action !== "revoke") {
    return NextResponse.json(
      { error: "Action must be 'approve', 'reject', or 'revoke'." },
      { status: 400 }
    );
  }

  const tip = await prisma.facilityTip.findUnique({
    where: { id },
    select: { id: true, facilityId: true, isApproved: true },
  });
  if (!tip) {
    return NextResponse.json({ error: "Tip not found." }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.facilityTip.update({
      where: { id },
      data: { isApproved: true, flagged: false },
    });

    // Update facility tipCount
    const count = await prisma.facilityTip.count({
      where: { facilityId: tip.facilityId, isApproved: true },
    });
    await prisma.facility.update({
      where: { id: tip.facilityId },
      data: { tipCount: count },
    });
  } else if (action === "revoke") {
    await prisma.facilityTip.update({
      where: { id },
      data: { isApproved: false },
    });

    // Update facility tipCount
    const count = await prisma.facilityTip.count({
      where: { facilityId: tip.facilityId, isApproved: true },
    });
    await prisma.facility.update({
      where: { id: tip.facilityId },
      data: { tipCount: count },
    });
  } else {
    // Reject = delete the tip
    await prisma.facilityTip.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
