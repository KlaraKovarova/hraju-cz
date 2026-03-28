import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";

export type ActivityItem = {
  type: "review" | "visit" | "event" | "badge";
  id: string;
  date: string;
  data: Record<string, unknown>;
};

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const [reviews, visits, events, badges] = await withTimeout(Promise.all([
      prisma.review.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          rating: true,
          title: true,
          helpful: true,
          isApproved: true,
          createdAt: true,
          facility: {
            select: {
              name: true,
              slug: true,
              sports: {
                take: 1,
                select: { sport: { select: { slug: true, nameCs: true } } },
              },
            },
          },
        },
      }),
      prisma.visit.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          createdAt: true,
          facility: {
            select: {
              name: true,
              slug: true,
              location: { select: { city: true } },
              sports: {
                take: 1,
                select: { sport: { select: { slug: true, nameCs: true } } },
              },
            },
          },
        },
      }),
      prisma.touristEvent.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          city: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.userBadge.findMany({
        where: { userId: session.userId },
        orderBy: { earnedAt: "desc" },
        take: 10,
        select: {
          id: true,
          badgeSlug: true,
          earnedAt: true,
        },
      }),
    ]));

    const items: ActivityItem[] = [];

    for (const r of reviews) {
      const sport = r.facility.sports[0]?.sport;
      items.push({
        type: "review",
        id: r.id,
        date: r.createdAt.toISOString(),
        data: {
          rating: r.rating,
          title: r.title,
          helpful: r.helpful,
          isApproved: r.isApproved,
          facilityName: r.facility.name,
          facilitySlug: r.facility.slug,
          sportSlug: sport?.slug ?? null,
          sportName: sport?.nameCs ?? null,
        },
      });
    }

    for (const v of visits) {
      const sport = v.facility.sports[0]?.sport;
      items.push({
        type: "visit",
        id: v.id,
        date: v.createdAt.toISOString(),
        data: {
          facilityName: v.facility.name,
          facilitySlug: v.facility.slug,
          city: v.facility.location.city,
          sportSlug: sport?.slug ?? null,
          sportName: sport?.nameCs ?? null,
        },
      });
    }

    for (const e of events) {
      items.push({
        type: "event",
        id: e.id,
        date: e.createdAt.toISOString(),
        data: {
          name: e.name,
          city: e.city,
          isActive: e.isActive,
        },
      });
    }

    for (const b of badges) {
      items.push({
        type: "badge",
        id: b.id,
        date: b.earnedAt.toISOString(),
        data: { badgeSlug: b.badgeSlug },
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(items.slice(0, 30));
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
