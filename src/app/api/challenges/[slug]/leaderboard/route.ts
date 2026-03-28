import { NextResponse } from "next/server";
import { MONTHLY_CHALLENGES } from "@/lib/monthly-challenges";
import { getChallengeLeaderboard } from "@/lib/data";
import { getUserSession } from "@/lib/user-auth";

// GET /api/challenges/[slug]/leaderboard — ranked participants for a challenge
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const challenge = MONTHLY_CHALLENGES.find((c) => c.slug === slug);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const [leaderboard, session] = await Promise.all([
    getChallengeLeaderboard(
      challenge.sportSlug,
      challenge.startDate,
      challenge.endDate,
      challenge.target,
      50
    ),
    getUserSession(),
  ]);

  // Find current user's rank if logged in
  let myRank: number | null = null;
  if (session) {
    const idx = leaderboard.findIndex((e) => e.userId === session.userId);
    if (idx !== -1) myRank = idx + 1;
  }

  return NextResponse.json({
    leaderboard,
    myRank,
    target: challenge.target,
  });
}
