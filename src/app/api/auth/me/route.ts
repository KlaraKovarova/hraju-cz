import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [reviewCount, visitCount] = await Promise.all([
    prisma.review.count({ where: { userId: session.userId } }),
    prisma.visit.count({ where: { userId: session.userId } }),
  ]);

  return NextResponse.json({
    userId: session.userId,
    email: session.email,
    name: session.name,
    reviewCount,
    visitCount,
  });
}
