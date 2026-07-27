import "server-only";

import { db } from "./db";

let cachedSettings: Awaited<ReturnType<typeof getSecuritySettings>> | null =
  null;

export type SecuritySettingsData = {
  id: string;
  minimumPasswordLength: number;
  passwordHistory: number;
  lockDuration: number;
  expirationDays: number;
  mfaRequired: boolean;
  maxFailedAttempts: number;
  requireSpecialChar: boolean;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireLowercase: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const DEFAULT_SETTINGS: Omit<
  SecuritySettingsData,
  "id" | "createdAt" | "updatedAt"
> = {
  minimumPasswordLength: 12,
  passwordHistory: 5,
  lockDuration: 15,
  expirationDays: 90,
  mfaRequired: false,
  maxFailedAttempts: 5,
  requireSpecialChar: true,
  requireUppercase: true,
  requireNumber: true,
  requireLowercase: true,
};

/**
 * Fetches the singleton SecuritySettings row.
 * Uses globalThis caching for the request lifecycle (same pattern as db.ts).
 */
export async function getSecuritySettings(): Promise<SecuritySettingsData> {
  if (cachedSettings) {
    return cachedSettings;
  }

  const row = await db.securitySettings.findFirst();

  if (!row) {
    const created = await db.securitySettings.create({
      data: DEFAULT_SETTINGS,
    });
    cachedSettings = created;
    return created;
  }

  cachedSettings = row;
  return row;
}

/**
 * Returns default settings without hitting the database.
 * Used for client-side validation when DB access isn't available.
 */
export function getDefaultSettings(): SecuritySettingsData {
  return {
    id: "defaults",
    ...DEFAULT_SETTINGS,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Clears the cached settings so the next getSecuritySettings() call
 * fetches fresh data from the database.
 */
export function clearSettingsCache(): void {
  cachedSettings = null;
}
