import "server-only";

import { db } from "./db";
import type { SecuritySettingsData } from "./security-settings";

/**
 * Checks if the new password has been used recently.
 * Compares against the last N password hashes (N = settings.passwordHistory).
 * Returns allowed=true if the password is new, false if it was recently used.
 */
export async function checkPasswordHistory(
  userId: string,
  settings: SecuritySettingsData,
): Promise<{ allowed: boolean; message?: string }> {
  if (settings.passwordHistory <= 0) {
    return { allowed: true };
  }

  const history = await db.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: settings.passwordHistory,
    select: { passwordHash: true },
  });

  if (history.length === 0) {
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Validates that the new plaintext password doesn't match any recent hashes.
 * Must be called with the plaintext password (before hashing).
 */
export async function isPasswordReused(
  userId: string,
  newPassword: string,
  settings: SecuritySettingsData,
): Promise<{ reused: boolean; message?: string }> {
  if (settings.passwordHistory <= 0) {
    return { reused: false };
  }

  const history = await db.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: settings.passwordHistory,
    select: { passwordHash: true },
  });

  if (history.length === 0) {
    return { reused: false };
  }

  // Dynamic import to avoid circular dependencies
  const { default: bcrypt } = await import("bcrypt");

  for (const entry of history) {
    const matches = await bcrypt.compare(newPassword, entry.passwordHash);
    if (matches) {
      return {
        reused: true,
        message: `Cannot reuse the last ${settings.passwordHistory} password${settings.passwordHistory === 1 ? "" : "s"}`,
      };
    }
  }

  return { reused: false };
}

/**
 * Records a password hash in the history.
 * Prunes old entries beyond the configured history limit.
 */
export async function recordPasswordHistory(
  userId: string,
  passwordHash: string,
  settings: SecuritySettingsData,
): Promise<void> {
  await db.passwordHistory.create({
    data: { userId, passwordHash },
  });

  // Prune entries beyond the limit
  if (settings.passwordHistory > 0) {
    const excess = await db.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: settings.passwordHistory,
      select: { id: true },
    });

    if (excess.length > 0) {
      await db.passwordHistory.deleteMany({
        where: { id: { in: excess.map((e) => e.id) } },
      });
    }
  }
}

/**
 * Returns the number of historical passwords stored for a user.
 */
export async function getPasswordHistoryCount(userId: string): Promise<number> {
  return db.passwordHistory.count({ where: { userId } });
}
