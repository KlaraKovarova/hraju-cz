import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSession, setUserCookie } from "@/lib/user-auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const name = request.nextUrl.searchParams.get("name");

  if (!token) {
    return NextResponse.redirect(
      new URL("/prihlaseni?error=missing_token", request.url)
    );
  }

  try {
    const loginToken = await prisma.loginToken.findUnique({
      where: { token },
    });

    if (!loginToken) {
      return NextResponse.redirect(
        new URL("/prihlaseni?error=invalid_token", request.url)
      );
    }

    if (loginToken.usedAt) {
      return NextResponse.redirect(
        new URL("/prihlaseni?error=used_token", request.url)
      );
    }

    if (loginToken.expiresAt < new Date()) {
      return NextResponse.redirect(
        new URL("/prihlaseni?error=expired_token", request.url)
      );
    }

    // Mark token as used
    await prisma.loginToken.update({
      where: { id: loginToken.id },
      data: { usedAt: new Date() },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: loginToken.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: loginToken.email,
          name: name?.trim() || null,
        },
      });
    } else if (name?.trim() && !user.name) {
      // Update name if not set yet
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
      });
    }

    // Create session and set cookie
    const jwt = await createUserSession(user.id, user.email, user.name);
    await setUserCookie(jwt);

    return NextResponse.redirect(
      new URL("/prihlaseni?success=1", request.url)
    );
  } catch (error) {
    console.error("Failed to verify login token:", error);
    return NextResponse.redirect(
      new URL("/prihlaseni?error=server_error", request.url)
    );
  }
}
