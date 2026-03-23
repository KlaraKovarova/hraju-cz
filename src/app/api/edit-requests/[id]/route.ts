import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, reviewNote } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "status must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const editRequest = await prisma.editRequest.update({
      where: { id },
      data: {
        status,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      },
      include: {
        facility: { select: { id: true, name: true, slug: true, isActive: true } },
      },
    });

    // When approving a new facility submission, activate the facility
    if (status === "APPROVED" && !editRequest.facility.isActive) {
      await prisma.facility.update({
        where: { id: editRequest.facilityId },
        data: { isActive: true },
      });
    }

    return NextResponse.json(editRequest);
  } catch {
    return NextResponse.json(
      { error: "Failed to update edit request" },
      { status: 500 }
    );
  }
}
