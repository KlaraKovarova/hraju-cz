import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

// GET /api/admin/banners — list all banners with stats
export async function GET(request: NextRequest) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(banners);
  } catch {
    return NextResponse.json({ error: "Databáze je nedostupná." }, { status: 503 });
  }
}

// POST /api/admin/banners — create a new banner
export async function POST(request: NextRequest) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, imageUrl, targetUrl, placement, sportFilter, isActive, startDate, endDate } = body;

    if (!name || !imageUrl || !targetUrl || !placement?.length) {
      return NextResponse.json({ error: "name, imageUrl, targetUrl, and placement are required" }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        name,
        imageUrl,
        targetUrl,
        placement,
        sportFilter: sportFilter || [],
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba při vytváření banneru." }, { status: 500 });
  }
}
