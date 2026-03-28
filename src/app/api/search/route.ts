import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchFacilities } from "@/lib/data";
import { getAllPosts } from "@/lib/blog";
import { withTimeout } from "@/lib/db-timeout";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query = sp.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(sp.get("limit") || "10", 10), 50);

  if (query.length < 2) {
    return NextResponse.json({ facilities: [], events: [], posts: [] });
  }

  try {
    const [facilities, events, posts] = await Promise.all([
      searchFacilitiesApi(query, limit),
      searchEvents(query, limit),
      searchPosts(query, limit),
    ]);

    return NextResponse.json({ facilities, events, posts }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json(
      { facilities: [], events: [], posts: [] },
      { status: 503 },
    );
  }
}

async function searchFacilitiesApi(query: string, limit: number) {
  const results = await searchFacilities(query, undefined, limit);
  return results.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    city: f.location.city,
    sportSlug: f.sports[0]?.sport.slug ?? "tenis",
    sportName: f.sports[0]?.sport.nameCs ?? "",
    averageRating: f.averageRating,
    reviewCount: f.reviewCount,
    isPremium: f.isPremium,
    image: f.images[0]?.url ?? null,
  }));
}

async function searchEvents(query: string, limit: number) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return [];

  const now = new Date();
  const events = await withTimeout(prisma.touristEvent.findMany({
    where: {
      isActive: true,
      dateStart: { gte: now },
      AND: tokens.map((token) => ({
        OR: [
          { name: { contains: token, mode: "insensitive" as const } },
          { city: { contains: token, mode: "insensitive" as const } },
          { description: { contains: token, mode: "insensitive" as const } },
        ],
      })),
    },
    orderBy: { dateStart: "asc" },
    take: limit,
    select: {
      id: true,
      name: true,
      dateStart: true,
      dateEnd: true,
      city: true,
      region: true,
      externalUrl: true,
    },
  }));

  return events;
}

async function searchPosts(query: string, limit: number) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return [];

  const allPosts = getAllPosts();
  const matched = allPosts.filter((post) => {
    const titleLower = post.title.toLowerCase();
    const excerptLower = post.excerpt.toLowerCase();
    const tagsLower = post.sportTags.join(" ").toLowerCase();

    return tokens.every(
      (token) =>
        titleLower.includes(token) ||
        excerptLower.includes(token) ||
        tagsLower.includes(token),
    );
  });

  return matched.slice(0, limit).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date: p.date,
    category: p.category,
    image: p.image ?? null,
    sportTags: p.sportTags,
  }));
}
