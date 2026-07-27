import "server-only";

import type { SecuritySettingsData } from "./security-settings";

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a password against the SecuritySettings policy.
 */
export function validatePasswordAgainstPolicy(
  password: string,
  settings: SecuritySettingsData,
): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < settings.minimumPasswordLength) {
    errors.push(
      `Password must be at least ${settings.minimumPasswordLength} characters`,
    );
  }

  if (settings.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (settings.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (settings.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (settings.requireSpecialChar && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Checks if a new password matches any of the recent password hashes.
 * Uses bcrypt.compare to compare against stored history.
 */
export async function checkPasswordReuse(
  newPasswordHash: string,
  recentHashes: string[],
): Promise<{ allowed: boolean; message?: string }> {
  // Dynamic import to avoid circular dependencies
  const { default: bcrypt } = await import("bcrypt");

  for (let i = 0; i < recentHashes.length; i++) {
    const matches = await bcrypt.compare(newPasswordHash, recentHashes[i]);
    if (matches) {
      return {
        allowed: false,
        message: `Cannot reuse the last ${recentHashes.length} password${recentHashes.length === 1 ? "" : "s"}`,
      };
    }
  }

  return { allowed: true };
}
