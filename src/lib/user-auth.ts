import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "user_session";

let cachedSecret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.USER_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "USER_JWT_SECRET environment variable is required. Set a strong random value in your environment."
    );
  }
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string | null;
}

export async function createUserSession(
  userId: string,
  email: string,
  name: string | null
): Promise<string> {
  const jwt = await new SignJWT({ userId, email, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
  return jwt;
}

export async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
