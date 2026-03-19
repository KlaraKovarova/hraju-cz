import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOwnerSession, setOwnerCookie, clearOwnerSession } from "@/lib/owner-auth";

// Owner authenticates with token → gets session cookie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const ownerToken = await prisma.ownerToken.findUnique({
      where: { token },
      include: {
        facility: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!ownerToken) {
      return NextResponse.json({ error: "Neplatný token" }, { status: 401 });
    }

    if (ownerToken.expiresAt && ownerToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token vypršel" }, { status: 401 });
    }

    // Mark token as used and claim the facility
    await prisma.$transaction([
      prisma.ownerToken.update({
        where: { id: ownerToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.facility.update({
        where: { id: ownerToken.facilityId },
        data: { isClaimed: true },
      }),
    ]);

    const jwt = await createOwnerSession(ownerToken.facilityId, ownerToken.id);
    await setOwnerCookie(jwt);

    return NextResponse.json({
      facilityId: ownerToken.facilityId,
      facilityName: ownerToken.facility.name,
    });
  } catch (error) {
    console.error("Owner auth failed:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

// Owner logs out
export async function DELETE() {
  await clearOwnerSession();
  return NextResponse.json({ ok: true });
}
