import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/client";

export interface SessionPayload {
  userId: string;
  role: Role;
  expiresAt: Date;
}

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Creates a signed JWT session token and stores it in an HttpOnly cookie.
 *
 * Cookie security flags:
 * - HttpOnly: prevents XSS from accessing the token
 * - Secure: only sent over HTTPS (disabled in dev)
 * - SameSite=Lax: prevents CSRF on cross-origin requests
 */
export async function createSession(userId: string, role: Role): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const token = await new SignJWT({
    userId,
    role,
    expiresAt: expiresAt.toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Reads and verifies the JWT session from the cookie.
 * Returns null if no session exists or verification fails.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    return {
      userId: payload.userId as string,
      role: payload.role as Role,
      expiresAt: new Date(payload.expiresAt as string),
    };
  } catch {
    return null;
  }
}

/**
 * Deletes the session cookie, effectively logging the user out.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
