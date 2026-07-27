import "server-only";

import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { db } from "./db";

const TOKEN_EXPIRY_MINUTES = 15;

/**
 * Generates a cryptographically secure reset token for a user.
 * Stores a bcrypt hash of the token in the database.
 * Returns the raw token (to be sent to the user).
 */
export async function generateResetToken(userId: string): Promise<string> {
  // Generate 32 random bytes as hex string
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Hash the token for storage (bcrypt, not plain)
  const hashedToken = await bcrypt.hash(rawToken, 10);

  // Invalidate any existing unused tokens for this user
  await db.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(), // Mark old tokens as "used" to invalidate them
    },
  });

  // Create the new token
  await db.passwordResetToken.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  return rawToken;
}

/**
 * Validates a reset token from the URL.
 * Returns the userId if valid, null otherwise.
 */
export async function validateResetToken(
  rawToken: string,
): Promise<{ valid: boolean; userId?: string }> {
  // Find all recent unused tokens (can't reverse bcrypt, so scan recent ones)
  const recentTokens = await db.passwordResetToken.findMany({
    where: {
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Limit scan to recent tokens
    select: {
      id: true,
      token: true,
      userId: true,
    },
  });

  // Compare the raw token against stored hashes
  for (const entry of recentTokens) {
    const matches = await bcrypt.compare(rawToken, entry.token);
    if (matches) {
      return { valid: true, userId: entry.userId };
    }
  }

  return { valid: false };
}

/**
 * Marks a reset token as used.
 */
export async function markResetTokenUsed(rawToken: string): Promise<void> {
  const recentTokens = await db.passwordResetToken.findMany({
    where: {
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
    take: 50,
    select: {
      id: true,
      token: true,
    },
  });

  for (const entry of recentTokens) {
    const matches = await bcrypt.compare(rawToken, entry.token);
    if (matches) {
      await db.passwordResetToken.update({
        where: { id: entry.id },
        data: { usedAt: new Date() },
      });
      return;
    }
  }
}

/**
 * Cleans up expired and used reset tokens.
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await db.passwordResetToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
    },
  });
  return result.count;
}
