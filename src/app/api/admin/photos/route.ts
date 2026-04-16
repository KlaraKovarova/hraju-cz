import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

// GET /api/admin/photos — list user photos for moderation
export async function GET(request: NextRequest) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all"; // all, hidden, visible

  const where =
    filter === "hidden" ? { isHidden: true } :
    filter === "visible" ? { isHidden: false } :
    {};

  const photos = await prisma.userPhoto.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      url: true,
      alt: true,
      isHidden: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, isSeed: true } },
      facility: { select: { id: true, name: true, slug: true } },
      review: { select: { id: true, title: true } },
      visit: { select: { id: true } },
    },
  });

  return NextResponse.json({ photos });
}
