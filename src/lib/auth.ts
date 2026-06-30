import "server-only";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { getSession, type SessionPayload } from "./session";

const BCRYPT_COST_FACTOR = 12;

/**
 * Hashes a password using bcrypt with a cost factor of 12.
 *
 * bcrypt is chosen over SHA-256/MD5 because:
 * - It is deliberately slow (resistant to brute force)
 * - It includes a unique salt per hash (prevents rainbow table attacks)
 * - The cost factor can be increased as hardware improves
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Returns the verified session or redirects to login.
 * Use this in server components and server actions that require authentication.
 */
export async function verifySession(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

/**
 * Authorization helper that checks if the current user has one of the allowed roles.
 * Throws an error if unauthorized (not a redirect — use in API routes and actions).
 */
export async function requireRole(
  allowedRoles: Role[],
): Promise<SessionPayload> {
  const session = await verifySession();

  if (!allowedRoles.includes(session.role)) {
    throw new Error(
      `Forbidden: role '${session.role}' is not authorized for this action.`,
    );
  }

  return session;
}
