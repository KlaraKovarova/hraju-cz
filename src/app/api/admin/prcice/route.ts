import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const routes = await prisma.prciceRoute.findMany({
    orderBy: [{ year: "desc" }, { distanceKm: "desc" }],
  });

  return NextResponse.json(routes);
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, mapEmbed } = body as { id: string; mapEmbed: string | null };

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.prciceRoute.update({
    where: { id },
    data: { mapEmbed: mapEmbed ?? null },
  });

  return NextResponse.json(updated);
}
