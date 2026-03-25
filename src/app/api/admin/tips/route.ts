import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/tips — list tips with optional filter
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter");

  const where =
    filter === "pending" ? { isApproved: false, flagged: false }
    : filter === "approved" ? { isApproved: true }
    : filter === "flagged" ? { flagged: true }
    : {};

  try {
    const tips = await prisma.facilityTip.findMany({
      where,
      include: {
        facility: { select: { id: true, name: true, slug: true } },
        user: { select: { name: true, email: true, isSeed: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tips);
  } catch {
    return NextResponse.json({ error: "Databáze je nedostupná." }, { status: 503 });
  }
}
