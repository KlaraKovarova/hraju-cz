import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

const DEFAULT_PAGE_SIZE = 50;

// GET /api/admin/conditions — list condition reports for moderation
// Query params:
//   - showHidden=1 to include soft-deleted reports (default: hidden excluded)
//   - flaggedOnly=1 to show only reports with flagCount > 0
//   - page=N (1-indexed) for pagination
export async function GET(request: NextRequest) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const showHidden = searchParams.get("showHidden") === "1";
  const flaggedOnly = searchParams.get("flaggedOnly") === "1";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const skip = (page - 1) * DEFAULT_PAGE_SIZE;

  const where: {
    isHidden?: boolean;
    flagCount?: { gt: number };
  } = {};
  if (!showHidden) where.isHidden = false;
  if (flaggedOnly) where.flagCount = { gt: 0 };

  const [reports, total] = await Promise.all([
    prisma.conditionReport.findMany({
      where,
      // Flagged reports first, then newest
      orderBy: [{ flagCount: "desc" }, { createdAt: "desc" }],
      skip,
      take: DEFAULT_PAGE_SIZE,
      select: {
        id: true,
        rating: true,
        comment: true,
        helpful: true,
        flagCount: true,
        visitedAt: true,
        createdAt: true,
        isHidden: true,
        facility: {
          select: {
            id: true,
            name: true,
            slug: true,
            sports: {
              select: { sport: { select: { slug: true } } },
              take: 1,
            },
          },
        },
        user: { select: { id: true, name: true, email: true } },
        photos: {
          where: { isHidden: false },
          select: { id: true, url: true, alt: true },
          orderBy: { createdAt: "asc" },
          take: 3,
        },
      },
    }),
    prisma.conditionReport.count({ where }),
  ]);

  return NextResponse.json({
    reports,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)),
  });
}
