import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "owner_session";

let cachedSecret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.OWNER_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "OWNER_JWT_SECRET environment variable is required. Set a strong random value in your environment."
    );
  }
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

export interface OwnerSession {
  facilityId: string;
  tokenId: string;
}

export async function createOwnerSession(facilityId: string, tokenId: string): Promise<string> {
  const jwt = await new SignJWT({ facilityId, tokenId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
  return jwt;
}

export async function setOwnerCookie(jwt: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

export async function getOwnerSession(): Promise<OwnerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      facilityId: payload.facilityId as string,
      tokenId: payload.tokenId as string,
    };
  } catch {
    return null;
  }
}

export async function clearOwnerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
