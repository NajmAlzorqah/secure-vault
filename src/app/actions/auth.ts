"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
import { loginSchema } from "@/lib/validations";

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

  // Validate input
  const parsed = loginSchema.safeParse({
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
      message: "Invalid email or password.",
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
    const timeStr =
      minutes > 0
        ? `${minutes} minute${minutes !== 1 ? "s" : ""} and ${seconds} second${seconds !== 1 ? "s" : ""}`
        : `${seconds} second${seconds !== 1 ? "s" : ""}`;

    return {
      message: `Account is temporarily locked. Please try again after ${timeStr}.`,
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
      const lockMinutes = settings.lockDuration;
      return {
        message: `Too many failed attempts. Account locked for ${lockMinutes} minute${lockMinutes !== 1 ? "s" : ""}.`,
      };
    }

    // Return progressive delay info
    if (delayMs > 0) {
      const delaySec = Math.ceil(delayMs / 1000);
      return {
        message: `Invalid email or password. Please wait ${delaySec} second${delaySec !== 1 ? "s" : ""} before trying again.`,
        delaySeconds: delaySec,
      };
    }

    return {
      message: "Invalid email or password.",
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
