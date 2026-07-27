import "server-only";

import { db } from "./db";

// Progressive delay tiers (in milliseconds)
const DELAY_TIERS = [
  { maxAttempts: 4, delayMs: 0 },
  { maxAttempts: 9, delayMs: 5_000 },
  { maxAttempts: 14, delayMs: 30_000 },
  { maxAttempts: Number.MAX_SAFE_INTEGER, delayMs: 300_000 }, // 5 minutes
];

/**
 * Returns the progressive delay in milliseconds based on the number of attempts.
 */
export function getProgressiveDelay(attemptCount: number): number {
  for (const tier of DELAY_TIERS) {
    if (attemptCount <= tier.maxAttempts) {
      return tier.delayMs;
    }
  }
  const last = DELAY_TIERS.at(-1);
  return last ? last.delayMs : 0;
}

/**
 * Records a failed login attempt in the database.
 * Returns the total recent attempt count and the delay to apply.
 */
export async function recordFailedAttempt(
  email: string,
  userId: string | null,
  ipAddress: string,
  userAgent: string | null,
): Promise<{ attemptCount: number; delayMs: number }> {
  await db.failedLoginAttempt.create({
    data: { email, userId, ipAddress, userAgent },
  });

  // Count attempts in the last 15 minutes (the lockout window)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const attemptCount = await db.failedLoginAttempt.count({
    where: {
      email,
      attemptedAt: { gte: fifteenMinutesAgo },
    },
  });

  const delayMs = getProgressiveDelay(attemptCount);

  return { attemptCount, delayMs };
}

/**
 * Clears all failed login attempts for the given email.
 * Called after a successful login.
 */
export async function clearFailedAttempts(email: string): Promise<void> {
  await db.failedLoginAttempt.deleteMany({
    where: { email },
  });
}

/**
 * Returns the number of failed attempts in the last N minutes.
 */
export async function getRecentFailedAttempts(
  email: string,
  withinMinutes = 15,
): Promise<number> {
  const since = new Date(Date.now() - withinMinutes * 60 * 1000);
  return db.failedLoginAttempt.count({
    where: {
      email,
      attemptedAt: { gte: since },
    },
  });
}

/**
 * Checks if an account is currently locked.
 * Returns null if not locked, or the unlock time if locked.
 */
export async function checkAccountLock(
  userId: string,
): Promise<{ locked: boolean; lockedUntil: Date | null }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });

  if (!user?.lockedUntil) {
    return { locked: false, lockedUntil: null };
  }

  if (new Date() < user.lockedUntil) {
    return { locked: true, lockedUntil: user.lockedUntil };
  }

  // Lock has expired — clear it
  await db.user.update({
    where: { id: userId },
    data: { lockedUntil: null },
  });

  return { locked: false, lockedUntil: null };
}

/**
 * Locks an account for the specified duration.
 */
export async function lockAccount(
  userId: string,
  durationMinutes: number,
): Promise<Date> {
  const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  await db.user.update({
    where: { id: userId },
    data: { lockedUntil },
  });
  return lockedUntil;
}
