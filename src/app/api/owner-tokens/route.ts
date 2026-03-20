import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// Admin endpoint: generate a claim token for a facility
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { facilityId, ownerEmail, ownerName, expiresInDays } = body;

    if (!facilityId) {
      return NextResponse.json({ error: "facilityId is required" }, { status: 400 });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, name: true },
    });
    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const ownerToken = await prisma.ownerToken.create({
      data: {
        facilityId,
        token,
        ownerEmail: ownerEmail || null,
        ownerName: ownerName || null,
        expiresAt,
      },
    });

    const claimUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.hraju.cz"}/moje-sportoviste?token=${token}`;

    return NextResponse.json({
      id: ownerToken.id,
      token,
      claimUrl,
      facilityName: facility.name,
      expiresAt: ownerToken.expiresAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create owner token:", error);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
