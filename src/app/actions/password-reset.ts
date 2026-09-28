"use server";

import { getTranslations } from "next-intl/server";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isPasswordReused,
  recordPasswordHistory,
} from "@/lib/password-history";
import {
  generateResetToken,
  markResetTokenUsed,
  validateResetToken,
} from "@/lib/password-reset";
import { getSecuritySettings } from "@/lib/security-settings";
import { getForgotPasswordSchema } from "@/lib/validations";

export interface PasswordResetState {
  message?: string;
  success?: boolean;
  token?: string;
  errors?: Record<string, string[]>;
}

/**
 * Requests a password reset for the given email.
 * Always returns a generic message to prevent email enumeration.
 *
 * WARNING: no mail transport is wired up, so the raw token is returned in the
 * response so the flow can be completed. Anyone who knows a registered email
 * can therefore mint a token and take over that account. Wire up email
 * delivery and stop returning the token before using this in production.
 */
export async function requestPasswordReset(
  email: string,
): Promise<PasswordResetState> {
  const t = await getTranslations("serverActions");
  const tv = await getTranslations("validation");

  const schema = getForgotPasswordSchema(tv);
  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return {
      message: t("resetGeneric"),
    };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  });

  // Always return the same message regardless of whether user exists
  if (!user) {
    return {
      message: t("resetGeneric"),
    };
  }

  const token = await generateResetToken(user.id);

  await logAudit({
    userId: user.id,
    action: "PASSWORD_RESET_REQUEST",
    details: `Password reset requested for ${user.email}`,
  });

  // TODO: send the reset link by email and stop returning the token.
  return {
    message: t("resetGeneric"),
    token,
  };
}

/**
 * Resets a user's password using a valid reset token.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<PasswordResetState> {
  const t = await getTranslations("serverActions");
  const tv = await getTranslations("validation");

  if (!token) {
    return { message: t("resetMissingToken") };
  }

  if (newPassword !== confirmPassword) {
    return { message: t("passwordsNoMatch") };
  }

  const settings = await getSecuritySettings();

  // Validate token
  const { valid, userId } = await validateResetToken(token);
  if (!valid || !userId) {
    return {
      message: t("resetTokenInvalid"),
    };
  }

  // Check password history
  const historyCheck = await isPasswordReused(userId, newPassword, settings);
  if (historyCheck.reused) {
    return {
      message: tv("passwordReuse", {
        count: historyCheck.historyCount ?? settings.passwordHistory,
      }),
    };
  }

  // Hash the new password
  const passwordHash = await hashPassword(newPassword);

  // Update password and invalidate all sessions
  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
      passwordChangedAt: new Date(),
      forcePasswordChange: false,
    },
  });

  // Record in history
  await recordPasswordHistory(userId, passwordHash, settings);

  // Mark token as used
  await markResetTokenUsed(token);

  await logAudit({
    userId,
    action: "PASSWORD_RESET_COMPLETE",
    details: "Password reset via token",
  });

  return {
    success: true,
    message: t("resetSuccess"),
  };
}
