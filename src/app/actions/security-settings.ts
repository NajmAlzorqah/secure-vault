"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
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

function createUpdateSchema(
  tv: (key: string, params?: Record<string, string | number | Date>) => string,
) {
  return {
    minimumPasswordLength: (v: unknown) => {
      const n = Number(v);
      if (Number.isNaN(n) || n < 12 || n > 64)
        return tv("between", { min: 12, max: 64 });
      return null;
    },
    passwordHistory: (v: unknown) => {
      const n = Number(v);
      if (Number.isNaN(n) || n < 0 || n > 24)
        return tv("between", { min: 0, max: 24 });
      return null;
    },
    lockDuration: (v: unknown) => {
      const n = Number(v);
      if (Number.isNaN(n) || n < 1 || n > 1440)
        return tv("betweenMinutes", { min: 1, max: 1440 });
      return null;
    },
    expirationDays: (v: unknown) => {
      const n = Number(v);
      if (Number.isNaN(n) || n < 0 || n > 3650)
        return tv("between", { min: 0, max: 3650 });
      return null;
    },
    maxFailedAttempts: (v: unknown) => {
      const n = Number(v);
      if (Number.isNaN(n) || n < 1 || n > 50)
        return tv("between", { min: 1, max: 50 });
      return null;
    },
  };
}

export async function updateSecuritySettings(
  _prevState: SecuritySettingsState | undefined,
  formData: FormData,
): Promise<SecuritySettingsState> {
  const session = await requireRole(["SUPER_ADMIN"]);
  const { ipAddress, userAgent } = await getClientInfo();

  const t = await getTranslations("serverActions");
  const tv = await getTranslations("validation");

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

  const updateSchema = createUpdateSchema(tv);
  const errors: Record<string, string[]> = {};
  for (const [key, validator] of Object.entries(updateSchema)) {
    const error = validator(raw[key as keyof typeof raw]);
    if (error) {
      errors[key] = [error];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, message: t("invalidValues") };
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

  return { success: true, message: t("settingsUpdated") };
}
