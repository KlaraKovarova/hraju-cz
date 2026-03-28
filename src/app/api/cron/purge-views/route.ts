import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;
const RETENTION_DAYS = 90;

// POST /api/cron/purge-views
// Deletes FacilityView rows older than 90 days to control data growth.
// Called by GitHub Actions (weekly or monthly). Protected by CRON_SECRET.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  cutoff.setHours(0, 0, 0, 0);

  const result = await prisma.facilityView.deleteMany({
    where: { date: { lt: cutoff } },
  });

  return NextResponse.json({
    success: true,
    deleted: result.count,
    cutoffDate: cutoff.toISOString().split("T")[0],
  });
}
