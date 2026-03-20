import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";

export async function GET() {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    userId: session.userId,
    email: session.email,
    name: session.name,
  });
}
