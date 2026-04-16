import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

// GET /api/admin/reviews — list reviews with optional filter
export async function GET(request: NextRequest) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter"); // "pending", "approved", "rejected"

  const where =
    filter === "pending" ? { isApproved: false }
    : filter === "approved" ? { isApproved: true }
    : {};

  try {
    const reviews = await prisma.review.findMany({
      where,
      include: {
        facility: { select: { id: true, name: true, slug: true } },
        user: { select: { isSeed: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Databáze je nedostupná." }, { status: 503 });
  }
}
