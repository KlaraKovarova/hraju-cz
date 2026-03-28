import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import { withTimeout } from "@/lib/db-timeout";

// GET /api/facilities/[id]/tips — list approved tips (paginated, sorted by helpful)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const sort = searchParams.get("sort") || "helpful";

  const orderBy: Record<string, string> =
    sort === "newest" ? { createdAt: "desc" } :
    sort === "oldest" ? { createdAt: "asc" } :
    { helpful: "desc" };

  const [tips, total] = await withTimeout(Promise.all([
    prisma.facilityTip.findMany({
      where: { facilityId: id, isApproved: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        userId: true,
        text: true,
        helpful: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.facilityTip.count({ where: { facilityId: id, isApproved: true } }),
  ]));

  return NextResponse.json({
    tips: tips.map((t) => ({
      id: t.id,
      userId: t.userId,
      authorName: t.user.name || "Sportovec",
      text: t.text,
      helpful: t.helpful,
      createdAt: t.createdAt,
    })),
    total,
    page,
    limit,
  });
}

// POST /api/facilities/[id]/tips — submit a tip (requires user auth)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      { error: "Pro přidání tipu se musíte přihlásit." },
      { status: 401 }
    );
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text } = body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Text tipu je povinný." }, { status: 400 });
  }
  if (text.trim().length > 280) {
    return NextResponse.json({ error: "Tip může mít maximálně 280 znaků." }, { status: 400 });
  }

  // Check facility exists
  const facility = await prisma.facility.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!facility) {
    return NextResponse.json({ error: "Sportoviště nenalezeno." }, { status: 404 });
  }

  // Rate limit: max 3 tips per user per facility
  const facilityTipCount = await prisma.facilityTip.count({
    where: { facilityId: id, userId: session.userId },
  });
  if (facilityTipCount >= 3) {
    return NextResponse.json(
      { error: "Pro toto sportoviště jste již přidali maximum tipů (3)." },
      { status: 409 }
    );
  }

  // Rate limit: max 10 tips per user per day
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dailyCount = await prisma.facilityTip.count({
    where: {
      userId: session.userId,
      createdAt: { gte: dayStart },
    },
  });
  if (dailyCount >= 10) {
    return NextResponse.json(
      { error: "Překročen denní limit tipů. Zkuste to zítra." },
      { status: 429 }
    );
  }

  const tip = await prisma.facilityTip.create({
    data: {
      facilityId: id,
      userId: session.userId,
      text: text.trim(),
    },
  });

  return NextResponse.json(
    { id: tip.id, message: "Děkujeme za tip! Bude zobrazen po schválení." },
    { status: 201 }
  );
}
