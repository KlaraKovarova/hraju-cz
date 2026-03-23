import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/user-auth";

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

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
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

    // Create session and set cookie on the redirect response directly
    const jwt = await createUserSession(user.id, user.email, user.name);
    const successUrl = isNewUser ? "/prihlaseni?success=1&new=1" : "/prihlaseni?success=1";
    const response = NextResponse.redirect(
      new URL(successUrl, request.url)
    );
    response.cookies.set("user_session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Failed to verify login token:", error);
    return NextResponse.redirect(
      new URL("/prihlaseni?error=server_error", request.url)
    );
  }
}
