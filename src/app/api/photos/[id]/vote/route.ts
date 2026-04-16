import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import {
  currentWeekKey,
  isPhotoEligibleForVote,
} from "@/lib/photo-week";

// SIL-666 — vote for a photo as "foto týdne" candidate.
//
// Rules:
// - Auth required.
// - One vote per user per ISO week (changing mind = remove old vote + create new).
// - Voting on the same photo twice in the same week toggles the vote off.
// - Can't vote on own photo.
// - Photo must exist, not be hidden, and be <= 14 days old.
// - voteCount is denormalized on UserPhoto (recomputed by cron; we also
//   increment/decrement here for optimistic freshness).

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: photoId } = await params;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photo = await prisma.userPhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      userId: true,
      isHidden: true,
      createdAt: true,
      voteCount: true,
    },
  });

  if (!photo || photo.isHidden) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  if (photo.userId === session.userId) {
    return NextResponse.json(
      { error: "Na vlastní fotku hlasovat nelze" },
      { status: 403 }
    );
  }

  if (!isPhotoEligibleForVote(photo.createdAt)) {
    return NextResponse.json(
      { error: "Hlasovat lze pouze u fotek starších než 14 dní" },
      { status: 400 }
    );
  }

  const weekKey = currentWeekKey();

  // Case 1: user already voted for THIS photo this week — toggle off.
  const existingOnThisPhoto = await prisma.photoVote.findUnique({
    where: {
      photoId_userId_weekKey: {
        photoId: photo.id,
        userId: session.userId,
        weekKey,
      },
    },
    select: { id: true },
  });

  if (existingOnThisPhoto) {
    await prisma.$transaction([
      prisma.photoVote.delete({ where: { id: existingOnThisPhoto.id } }),
      prisma.userPhoto.update({
        where: { id: photo.id },
        data: { voteCount: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json({
      voted: false,
      voteCount: Math.max(0, photo.voteCount - 1),
      weekKey,
    });
  }

  // Case 2: user has a vote this week on a DIFFERENT photo — move it.
  const existingThisWeek = await prisma.photoVote.findFirst({
    where: { userId: session.userId, weekKey },
    select: { id: true, photoId: true },
  });

  const ops: Prisma.PrismaPromise<unknown>[] = [];

  if (existingThisWeek) {
    ops.push(prisma.photoVote.delete({ where: { id: existingThisWeek.id } }));
    ops.push(
      prisma.userPhoto.update({
        where: { id: existingThisWeek.photoId },
        data: { voteCount: { decrement: 1 } },
      })
    );
  }

  ops.push(
    prisma.photoVote.create({
      data: { photoId: photo.id, userId: session.userId, weekKey },
    })
  );
  ops.push(
    prisma.userPhoto.update({
      where: { id: photo.id },
      data: { voteCount: { increment: 1 } },
    })
  );

  await prisma.$transaction(ops);

  return NextResponse.json({
    voted: true,
    voteCount: photo.voteCount + 1,
    weekKey,
    movedFrom: existingThisWeek?.photoId ?? null,
  });
}

// GET — is the current user's vote for this week on this photo?
// Used by the client to hydrate button state on first render.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: photoId } = await params;
  const session = await getUserSession();
  const weekKey = currentWeekKey();

  const photo = await prisma.userPhoto.findUnique({
    where: { id: photoId },
    select: { id: true, userId: true, voteCount: true, createdAt: true, isHidden: true },
  });
  if (!photo || photo.isHidden) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const eligible = isPhotoEligibleForVote(photo.createdAt);
  const canVote = Boolean(session) && session!.userId !== photo.userId && eligible;

  let voted = false;
  if (session) {
    const mine = await prisma.photoVote.findUnique({
      where: {
        photoId_userId_weekKey: {
          photoId: photo.id,
          userId: session.userId,
          weekKey,
        },
      },
      select: { id: true },
    });
    voted = Boolean(mine);
  }

  return NextResponse.json({
    voted,
    canVote,
    eligible,
    voteCount: photo.voteCount,
    weekKey,
    authenticated: Boolean(session),
    isOwn: session?.userId === photo.userId,
  });
}
