import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

// GET — list all premium orders for admin panel
export async function GET(request: Request) {
  const isAdmin = await verifyAdminFromRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = await prisma.premiumOrder.findMany({
    where: status ? { status } : undefined,
    include: {
      facility: {
        select: { id: true, name: true, slug: true, isPremium: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
