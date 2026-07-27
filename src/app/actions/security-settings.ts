"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  clearSettingsCache,
  getSecuritySettings,
} from "@/lib/security-settings";
import { getClientInfo } from "./users";

export interface SecuritySettingsState {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
}

const updateSchema = {
  minimumPasswordLength: (v: unknown) => {
    const n = Number(v);
    if (Number.isNaN(n) || n < 12 || n > 64) return "Must be between 12 and 64";
    return null;
  },
  passwordHistory: (v: unknown) => {
    const n = Number(v);
    if (Number.isNaN(n) || n < 0 || n > 24) return "Must be between 0 and 24";
    return null;
  },
  lockDuration: (v: unknown) => {
    const n = Number(v);
    if (Number.isNaN(n) || n < 1 || n > 1440)
      return "Must be between 1 and 1440 minutes";
    return null;
  },
  expirationDays: (v: unknown) => {
    const n = Number(v);
    if (Number.isNaN(n) || n < 0 || n > 3650)
      return "Must be between 0 and 3650";
    return null;
  },
  maxFailedAttempts: (v: unknown) => {
    const n = Number(v);
    if (Number.isNaN(n) || n < 1 || n > 50) return "Must be between 1 and 50";
    return null;
  },
};

export async function updateSecuritySettings(
  _prevState: SecuritySettingsState | undefined,
  formData: FormData,
): Promise<SecuritySettingsState> {
  const session = await requireRole(["SUPER_ADMIN"]);
  const { ipAddress, userAgent } = await getClientInfo();

  const raw = {
    minimumPasswordLength: formData.get("minimumPasswordLength"),
    passwordHistory: formData.get("passwordHistory"),
    lockDuration: formData.get("lockDuration"),
    expirationDays: formData.get("expirationDays"),
    maxFailedAttempts: formData.get("maxFailedAttempts"),
    mfaRequired: formData.get("mfaRequired") === "on",
    requireSpecialChar: formData.get("requireSpecialChar") === "on",
    requireUppercase: formData.get("requireUppercase") === "on",
    requireNumber: formData.get("requireNumber") === "on",
    requireLowercase: formData.get("requireLowercase") === "on",
  };

  const errors: Record<string, string[]> = {};
  for (const [key, validator] of Object.entries(updateSchema)) {
    const error = validator(raw[key as keyof typeof raw]);
    if (error) {
      errors[key] = [error];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const settings = await getSecuritySettings();

  await db.securitySettings.update({
    where: { id: settings.id },
    data: {
      minimumPasswordLength: Number(raw.minimumPasswordLength),
      passwordHistory: Number(raw.passwordHistory),
      lockDuration: Number(raw.lockDuration),
      expirationDays: Number(raw.expirationDays),
      maxFailedAttempts: Number(raw.maxFailedAttempts),
      mfaRequired: raw.mfaRequired,
      requireSpecialChar: raw.requireSpecialChar,
      requireUppercase: raw.requireUppercase,
      requireNumber: raw.requireNumber,
      requireLowercase: raw.requireLowercase,
    },
  });

  clearSettingsCache();

  await logAudit({
    userId: session.userId,
    action: "UPDATE_USER",
    details: "Security policy settings updated",
    ipAddress,
    userAgent,
  });

  revalidatePath("/dashboard/security");
  revalidatePath("/dashboard/security/settings");

  return { success: true, message: "Security settings updated successfully." };
}
