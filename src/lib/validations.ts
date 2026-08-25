import { z } from "zod";
import type { SecuritySettingsData } from "./security-settings";

/**
 * Translator function shape compatible with next-intl's `t`.
 */
export type TranslateFn = (
  key: string,
  params?: Record<string, string | number | Date>,
) => string;

// ─── Dynamic Password Validation ─────────────────────────────────────────────

/**
 * Builds a Zod password validation based on SecuritySettings.
 * Used for server-side validation in actions and API routes.
 */
export function getPasswordValidationString(
  settings: SecuritySettingsData,
  t: TranslateFn,
): z.ZodString {
  let field = z.string().min(settings.minimumPasswordLength, {
    message: t("passwordMinLength", { count: settings.minimumPasswordLength }),
  });

  if (settings.requireUppercase) {
    field = field.regex(/[A-Z]/, { message: t("passwordUppercase") });
  }
  if (settings.requireLowercase) {
    field = field.regex(/[a-z]/, { message: t("passwordLowercase") });
  }
  if (settings.requireNumber) {
    field = field.regex(/[0-9]/, { message: t("passwordNumber") });
  }
  if (settings.requireSpecialChar) {
    field = field.regex(/[^a-zA-Z0-9]/, { message: t("passwordSpecial") });
  }

  return field;
}

// ─── Authentication ──────────────────────────────────────────────────────────

export const getLoginSchema = (t: TranslateFn) =>
  z.object({
    email: z
      .string()
      .min(1, { message: t("emailRequired") })
      .email({ message: t("emailInvalid") })
      .trim()
      .toLowerCase(),
    password: z.string().min(1, { message: t("passwordRequired") }),
  });

export type LoginInput = z.infer<ReturnType<typeof getLoginSchema>>;

export const getCredentialBaseShape = (t: TranslateFn) => ({
  title: z
    .string()
    .min(1, { message: t("titleRequired") })
    .max(100, { message: t("titleMax", { count: 100 }) })
    .trim(),
  username: z
    .string()
    .min(1, { message: t("usernameRequired") })
    .max(100, { message: t("usernameMax", { count: 100 }) })
    .trim(),
  url: z
    .string()
    .max(500, { message: t("urlMax", { count: 500 }) })
    .url({ message: t("urlInvalid") })
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(5000, { message: t("notesMax", { count: 5000 }) })
    .optional()
    .or(z.literal("")),
  category: z
    .string()
    .max(50, { message: t("categoryMax", { count: 50 }) })
    .optional()
    .or(z.literal("")),
});

export const getCreateCredentialSchema = (t: TranslateFn) =>
  z.object({
    ...getCredentialBaseShape(t),
    password: z
      .string()
      .min(12, { message: t("passwordMinLength", { count: 12 }) })
      .regex(/[a-zA-Z]/, { message: t("passwordLetter") })
      .regex(/[0-9]/, { message: t("passwordNumber") })
      .regex(/[^a-zA-Z0-9]/, { message: t("passwordSpecial") }),
  });

export type CreateCredentialInput = z.infer<
  ReturnType<typeof getCreateCredentialSchema>
>;

export const getUpdateCredentialSchema = (t: TranslateFn) =>
  z.object({
    ...getCredentialBaseShape(t),
    password: z
      .string()
      .min(12, { message: t("passwordMinLength", { count: 12 }) })
      .regex(/[a-zA-Z]/, { message: t("passwordLetter") })
      .regex(/[0-9]/, { message: t("passwordNumber") })
      .regex(/[^a-zA-Z0-9]/, { message: t("passwordSpecial") })
      .optional()
      .or(z.literal("")),
  });

export type UpdateCredentialInput = z.infer<
  ReturnType<typeof getUpdateCredentialSchema>
>;

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * Builds a createUserSchema with password validation driven by SecuritySettings.
 */
export function getCreateUserSchema(settings: SecuritySettingsData) {
  return (t: TranslateFn) =>
    z.object({
      name: z
        .string()
        .min(2, { message: t("nameMin", { count: 2 }) })
        .max(100, { message: t("nameMax", { count: 100 }) })
        .trim(),
      email: z
        .string()
        .min(1, { message: t("emailRequired") })
        .email({ message: t("emailInvalid") })
        .trim()
        .toLowerCase(),
      password: getPasswordValidationString(settings, t),
      role: z.enum(["SUPER_ADMIN", "EDITOR", "VIEWER"], {
        message: t("roleRequired"),
      }),
    });
}

/**
 * Builds an updateUserSchema with password validation driven by SecuritySettings.
 */
export function getUpdateUserSchema(settings: SecuritySettingsData) {
  return (t: TranslateFn) =>
    z.object({
      id: z.string().uuid(),
      name: z
        .string()
        .min(2, { message: t("nameMin", { count: 2 }) })
        .max(100, { message: t("nameMax", { count: 100 }) })
        .trim()
        .optional(),
      email: z
        .string()
        .email({ message: t("emailInvalid") })
        .trim()
        .toLowerCase()
        .optional(),
      role: z.enum(["SUPER_ADMIN", "EDITOR", "VIEWER"]).optional(),
      password: getPasswordValidationString(settings, t)
        .optional()
        .or(z.literal("")),
      forcePasswordChange: z.boolean().optional(),
    });
}

/**
 * Builds a changePasswordSchema with password validation driven by SecuritySettings.
 */
export function getChangePasswordSchema(settings: SecuritySettingsData) {
  return (t: TranslateFn) =>
    z
      .object({
        currentPassword: z
          .string()
          .min(1, { message: t("currentPasswordRequired") }),
        newPassword: getPasswordValidationString(settings, t),
        confirmPassword: z
          .string()
          .min(1, { message: t("confirmPasswordRequired") }),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: t("passwordsNoMatch"),
        path: ["confirmPassword"],
      });
}

export type CreateUserInput = z.infer<
  ReturnType<ReturnType<typeof getCreateUserSchema>>
>;

export type UpdateUserInput = z.infer<
  ReturnType<ReturnType<typeof getUpdateUserSchema>>
>;

// ─── Password Change ─────────────────────────────────────────────────────────

export const getDefaultChangePasswordSchema = (t: TranslateFn) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: t("currentPasswordRequired") }),
      newPassword: z
        .string()
        .min(12, { message: t("passwordMinLength", { count: 12 }) })
        .regex(/[a-zA-Z]/, { message: t("passwordLetter") })
        .regex(/[0-9]/, { message: t("passwordNumber") })
        .regex(/[^a-zA-Z0-9]/, { message: t("passwordSpecial") }),
      confirmPassword: z
        .string()
        .min(1, { message: t("confirmPasswordRequired") }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordsNoMatch"),
      path: ["confirmPassword"],
    });

export type ChangePasswordInput = z.infer<
  ReturnType<typeof getDefaultChangePasswordSchema>
>;

// ─── Shared ───────────────────────────────────────────────────────────────────

export const idSchema = z.object({
  id: z.string().uuid(),
});

export type IdInput = z.infer<typeof idSchema>;

// ─── Reveal ───────────────────────────────────────────────────────────────────

export const revealCredentialSchema = z.object({
  credentialId: z.string().uuid(),
});

export type RevealCredentialInput = z.infer<typeof revealCredentialSchema>;

// ─── Password Reset ──────────────────────────────────────────────────────────

export const getForgotPasswordSchema = (t: TranslateFn) =>
  z.object({
    email: z
      .string()
      .min(1, { message: t("emailRequired") })
      .email({ message: t("emailInvalid") })
      .trim()
      .toLowerCase(),
  });

export type ForgotPasswordInput = z.infer<
  ReturnType<typeof getForgotPasswordSchema>
>;

export function getResetPasswordSchema(settings: SecuritySettingsData) {
  return (t: TranslateFn) =>
    z
      .object({
        token: z.string().min(1, { message: t("tokenRequired") }),
        newPassword: getPasswordValidationString(settings, t),
        confirmPassword: z
          .string()
          .min(1, { message: t("confirmPasswordRequired") }),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: t("passwordsNoMatch"),
        path: ["confirmPassword"],
      });
}

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * Client-side reset password schema with sensible defaults.
 * Server will validate against actual SecuritySettings.
 */
export const getResetPasswordClientSchema = (t: TranslateFn) =>
  z
    .object({
      token: z.string().min(1, { message: t("tokenRequired") }),
      newPassword: z
        .string()
        .min(12, { message: t("passwordMinLength", { count: 12 }) })
        .regex(/[A-Z]/, { message: t("passwordUppercase") })
        .regex(/[a-z]/, { message: t("passwordLowercase") })
        .regex(/[0-9]/, { message: t("passwordNumber") })
        .regex(/[^a-zA-Z0-9]/, { message: t("passwordSpecial") }),
      confirmPassword: z
        .string()
        .min(1, { message: t("confirmPasswordRequired") }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordsNoMatch"),
      path: ["confirmPassword"],
    });

// ─── Security Settings ──────────────────────────────────────────────────────

export const securitySettingsSchema = z.object({
  minimumPasswordLength: z.number(),
  passwordHistory: z.number(),
  lockDuration: z.number(),
  expirationDays: z.number(),
  maxFailedAttempts: z.number(),
  requireSpecialChar: z.boolean(),
  requireUppercase: z.boolean(),
  requireNumber: z.boolean(),
  requireLowercase: z.boolean(),
});

export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
