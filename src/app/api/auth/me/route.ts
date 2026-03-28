import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";
import { SPORTS } from "@/lib/sports";

const validSportSlugs = new Set<string>(SPORTS.map((s) => s.slug));

export async function GET() {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user, reviewCount, visitCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { bio: true, location: true, favoriteSports: true },
    }),
    prisma.review.count({ where: { userId: session.userId } }),
    prisma.visit.count({ where: { userId: session.userId } }),
  ]);

  return NextResponse.json({
    userId: session.userId,
    email: session.email,
    name: session.name,
    bio: user?.bio ?? null,
    location: user?.location ?? null,
    favoriteSports: user?.favoriteSports ?? [],
    reviewCount,
    visitCount,
  });
}

// PATCH /api/auth/me — update user profile (name, bio, location, favoriteSports)
export async function PATCH(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { name?: string; bio?: string; location?: string; favoriteSports?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const trimmed = body.name.trim().slice(0, 100);
    data.name = trimmed || null;
  }

  if (typeof body.bio === "string") {
    const trimmed = body.bio.trim().slice(0, 200);
    data.bio = trimmed || null;
  }

  if (typeof body.location === "string") {
    const trimmed = body.location.trim().slice(0, 100);
    data.location = trimmed || null;
  }

  if (Array.isArray(body.favoriteSports)) {
    data.favoriteSports = body.favoriteSports
      .filter((s): s is string => typeof s === "string" && validSportSlugs.has(s))
      .slice(0, 9);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { name: true, bio: true, location: true, favoriteSports: true },
  });

  return NextResponse.json(updated);
}
