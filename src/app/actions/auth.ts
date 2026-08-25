"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { intlLocaleFor } from "@/i18n/config";
import { logAudit } from "@/lib/audit";
import { verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  checkAccountLock,
  clearFailedAttempts,
  lockAccount,
  recordFailedAttempt,
} from "@/lib/progressive-delay";
import { getSecuritySettings } from "@/lib/security-settings";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { getLoginSchema } from "@/lib/validations";

export interface AuthState {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
  delaySeconds?: number;
}

export async function login(
  _prevState: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  // Get client info for audit logging
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";
  const userAgent = headersList.get("user-agent") ?? "unknown";

  const settings = await getSecuritySettings();
  const t = await getTranslations("serverActions");
  const tv = await getTranslations("validation");
  const locale = await getLocale();

  // Validate input
  const schema = getLoginSchema(tv);
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  // Look up user
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      name: true,
      sessionVersion: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    // Don't reveal whether the email exists — still record the attempt
    await recordFailedAttempt(email, null, ipAddress, userAgent);
    await logAudit({
      userId: null,
      action: "LOGIN_FAILED",
      details: `Failed login attempt for email: ${email}`,
      ipAddress,
      userAgent,
    });
    return {
      message: t("invalidCredentials"),
    };
  }

  // Check if account is locked
  const lockStatus = await checkAccountLock(user.id);
  if (lockStatus.locked && lockStatus.lockedUntil) {
    const remainingSec = Math.ceil(
      (lockStatus.lockedUntil.getTime() - Date.now()) / 1000,
    );
    const minutes = Math.floor(remainingSec / 60);
    const seconds = remainingSec % 60;

    const parts: string[] = [];
    if (minutes > 0) parts.push(t("durationMinutes", { count: minutes }));
    if (seconds > 0 || parts.length === 0) {
      parts.push(t("durationSeconds", { count: seconds }));
    }
    const timeStr = new Intl.ListFormat(intlLocaleFor(locale), {
      type: "unit",
    }).format(parts);

    return {
      message: t("accountLocked", { time: timeStr }),
    };
  }

  // Verify password
  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    // Record failed attempt and get progressive delay info
    const { attemptCount, delayMs } = await recordFailedAttempt(
      user.email,
      user.id,
      ipAddress,
      userAgent,
    );

    await logAudit({
      userId: user.id,
      action: "LOGIN_FAILED",
      details: `Invalid password (attempt #${attemptCount})`,
      ipAddress,
      userAgent,
    });

    // Lock account if max attempts exceeded
    if (attemptCount >= settings.maxFailedAttempts) {
      await lockAccount(user.id, settings.lockDuration);
      return {
        message: t("lockedForMinutes", { count: settings.lockDuration }),
      };
    }

    // Return progressive delay info
    if (delayMs > 0) {
      const delaySec = Math.ceil(delayMs / 1000);
      return {
        message: t("delayRetry", { count: delaySec }),
        delaySeconds: delaySec,
      };
    }

    return {
      message: t("invalidCredentials"),
    };
  }

  // Password is correct — clear failed attempts
  await clearFailedAttempts(user.email);

  // Check password expiry — set forcePasswordChange if expired
  let forcePasswordChange = false;
  if (settings.expirationDays > 0 && user.sessionVersion === 0) {
    // First login with no password change record — treat as needing change
    forcePasswordChange = true;
  }

  // Create session
  await createSession(user.id, user.role, user.sessionVersion);

  // Audit log
  await logAudit({
    userId: user.id,
    action: "LOGIN",
    details: `User ${user.email} logged in`,
    ipAddress,
    userAgent,
  });

  // If force password change needed, redirect to settings
  if (forcePasswordChange) {
    redirect("/dashboard/settings?forceChange=1");
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const session = await getSession();

  if (session) {
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";
    const userAgent = headersList.get("user-agent") ?? "unknown";

    await logAudit({
      userId: session.userId,
      action: "LOGOUT",
      details: "User logged out",
      ipAddress,
      userAgent,
    });
  }

  await deleteSession();
  redirect("/login");
}
