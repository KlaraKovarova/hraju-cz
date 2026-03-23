import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const isAdmin = await verifyAdminFromRequest(request);
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 50;

  const where =
    filter === "pending"
      ? { isActive: false, source: "user" }
      : filter === "active"
        ? { isActive: true }
        : filter === "user"
          ? { source: "user" }
          : {};

  const [events, total] = await Promise.all([
    prisma.touristEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.touristEvent.count({ where }),
  ]);

  return NextResponse.json({ events, total, page, pages: Math.ceil(total / limit) });
}
