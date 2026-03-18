import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      facilityId,
      submitterName,
      submitterEmail,
      submitterPhone,
      isOwner,
      changes,
      message,
    } = body;

    if (!facilityId || !submitterName || !submitterEmail || !changes) {
      return NextResponse.json(
        { error: "facilityId, submitterName, submitterEmail, and changes are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Verify facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true },
    });

    if (!facility) {
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 }
      );
    }

    const editRequest = await prisma.editRequest.create({
      data: {
        facilityId,
        submitterName,
        submitterEmail,
        submitterPhone: submitterPhone || null,
        isOwner: isOwner ?? false,
        changes,
        message: message || null,
      },
    });

    return NextResponse.json(editRequest, { status: 201 });
  } catch (error) {
    console.error("Failed to create edit request:", error);
    return NextResponse.json(
      { error: "Failed to submit edit request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const editRequests = await prisma.editRequest.findMany({
      where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {},
      include: {
        facility: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(editRequests);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 }
    );
  }
}
