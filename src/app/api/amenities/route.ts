import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/amenities — list all amenities
export async function GET() {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: { nameCs: "asc" },
    });
    return NextResponse.json(amenities);
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}
