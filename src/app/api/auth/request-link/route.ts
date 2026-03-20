import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendUserLoginEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit: max 5 tokens per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await prisma.loginToken.count({
      where: {
        email: normalizedEmail,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentTokens >= 5) {
      return NextResponse.json(
        { error: "Příliš mnoho požadavků. Zkuste to za chvíli." },
        { status: 429 }
      );
    }

    // Find or reference user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Create login token
    const token = randomBytes(32).toString("hex");
    await prisma.loginToken.create({
      data: {
        token,
        email: normalizedEmail,
        userId: existingUser?.id ?? null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // If user doesn't exist yet and name was provided, we'll use it during verification
    // Store name in a separate way — we'll pass it via the token URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hraju.cz";
    const loginUrl = new URL("/prihlaseni", baseUrl);
    loginUrl.searchParams.set("token", token);
    if (name && !existingUser) {
      loginUrl.searchParams.set("name", name.trim());
    }

    await sendUserLoginEmail(normalizedEmail, loginUrl.toString());

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create login token:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
