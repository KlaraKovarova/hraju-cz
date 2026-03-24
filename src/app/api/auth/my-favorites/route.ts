import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

// GET — list current user's favorited facilities
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        facility: {
          select: {
            name: true,
            slug: true,
            address: true,
            averageRating: true,
            reviewCount: true,
            location: { select: { city: true } },
            sports: {
              include: { sport: { select: { slug: true, nameCs: true, icon: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json(favorites);
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
