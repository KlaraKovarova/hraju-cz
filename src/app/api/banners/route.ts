import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";

// GET /api/banners?placement=X&sport=Y — fetch active banners for a slot
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement");
  const sport = searchParams.get("sport");

  if (!placement) {
    return NextResponse.json({ error: "placement is required" }, { status: 400 });
  }

  const now = new Date();

  try {
    const banners = await withTimeout(prisma.banner.findMany({
      where: {
        isActive: true,
        placement: { has: placement },
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ...(sport
            ? [{ OR: [{ sportFilter: { isEmpty: true } }, { sportFilter: { has: sport } }] }]
            : []),
        ],
      },
      select: {
        id: true,
        imageUrl: true,
        targetUrl: true,
        name: true,
      },
    }));

    return NextResponse.json(banners);
  } catch {
    return NextResponse.json({ error: "Databáze je nedostupná." }, { status: 503 });
  }
}
