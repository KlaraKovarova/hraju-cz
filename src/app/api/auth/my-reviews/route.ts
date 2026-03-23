import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        text: true,
        helpful: true,
        isApproved: true,
        createdAt: true,
        facility: {
          select: {
            name: true,
            slug: true,
            sports: {
              take: 1,
              select: { sport: { select: { slug: true, nameCs: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
