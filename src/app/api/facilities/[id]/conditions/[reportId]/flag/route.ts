import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

const FLAG_REASON_MAX = 280;

// POST /api/facilities/[id]/conditions/[reportId]/flag
// Authenticated users can flag a condition report for admin review.
// Dedup: one flag per (user, report). Increments ConditionReport.flagCount
// only when a new flag row is created.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      { error: "Pro nahlášení reportu se musíte přihlásit." },
      { status: 401 }
    );
  }

  // Parse optional reason (fire-and-forget; we still allow empty body)
  let reason: string | null = null;
  try {
    const body = (await request.json().catch(() => null)) as
      | { reason?: unknown }
      | null;
    if (body && typeof body.reason === "string") {
      const trimmed = body.reason.trim().slice(0, FLAG_REASON_MAX);
      if (trimmed.length > 0) reason = trimmed;
    }
  } catch {
    /* ignore parse errors; empty body is valid */
  }

  const report = await prisma.conditionReport.findFirst({
    where: { id: reportId, facilityId: id },
    select: { id: true, userId: true },
  });
  if (!report) {
    return NextResponse.json({ error: "Report nenalezen." }, { status: 404 });
  }

  // Users can't flag their own reports
  if (report.userId === session.userId) {
    return NextResponse.json(
      { error: "Vlastní report nelze nahlásit." },
      { status: 400 }
    );
  }

  // Idempotent: if the user already flagged, short-circuit without incrementing.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.conditionReportFlag.create({
        data: { reportId: report.id, userId: session.userId, reason },
      });
      await tx.conditionReport.update({
        where: { id: report.id },
        data: { flagCount: { increment: 1 } },
      });
    });
  } catch (err: unknown) {
    // P2002 = unique constraint violation on (reportId, userId)
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2002") {
      return NextResponse.json({ alreadyFlagged: true });
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}
