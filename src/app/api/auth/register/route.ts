import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createUserSession } from "@/lib/user-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-mail je povinný." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Heslo musí mít alespoň 6 znaků." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists with a password
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "Účet s tímto e-mailem již existuje. Přihlaste se." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    let user;
    if (existing) {
      // User exists from magic-link but has no password — set it
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          name: existing.name || name?.trim() || null,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name?.trim() || null,
          passwordHash,
        },
      });
    }

    // Create session
    const jwt = await createUserSession(user.id, user.email, user.name);

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
    response.cookies.set("user_session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
