import { NextRequest, NextResponse } from "next/server";
import { getAllApprovedReviews } from "@/lib/data";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const sport = sp.get("sport") || undefined;
  const sort = (sp.get("sort") as "newest" | "oldest" | "highest" | "lowest" | "helpful") || "newest";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") || "20", 10)));

  const { reviews, total } = await getAllApprovedReviews({ sport, sort, page, limit });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
