import { z } from "zod";
import type { SecuritySettingsData } from "./security-settings";

// ─── Dynamic Password Validation ─────────────────────────────────────────────

/**
 * Builds a Zod password validation string based on SecuritySettings.
 * Used for server-side validation in actions and API routes.
 */
export function getPasswordValidationString(
  settings: SecuritySettingsData,
): z.ZodString {
  let field = z
    .string()
    .min(
      settings.minimumPasswordLength,
      `Password must be at least ${settings.minimumPasswordLength} characters`,
    );

  if (settings.requireUppercase) {
    field = field.regex(
      /[A-Z]/,
      "Password must contain at least one uppercase letter",
    );
  }
  if (settings.requireLowercase) {
    field = field.regex(
      /[a-z]/,
      "Password must contain at least one lowercase letter",
    );
  }
  if (settings.requireNumber) {
    field = field.regex(/[0-9]/, "Password must contain at least one number");
  }
  if (settings.requireSpecialChar) {
    field = field.regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character",
    );
  }

  return field;
}

/**
 * Client-side representation of password rules driven by settings.
 * Used by the PasswordRules component to render the checklist.
 */
export interface PasswordRuleDef {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export function getPasswordRulesFromSettings(
  settings: SecuritySettingsData,
): PasswordRuleDef[] {
  const rules: PasswordRuleDef[] = [
    {
      id: "length",
      label: `At least ${settings.minimumPasswordLength} characters`,
      test: (p) => p.length >= settings.minimumPasswordLength,
    },
  ];

  if (settings.requireUppercase) {
    rules.push({
      id: "uppercase",
      label: "At least one uppercase letter",
      test: (p) => /[A-Z]/.test(p),
    });
  }
  if (settings.requireLowercase) {
    rules.push({
      id: "lowercase",
      label: "At least one lowercase letter",
      test: (p) => /[a-z]/.test(p),
    });
  }
  if (settings.requireNumber) {
    rules.push({
      id: "number",
      label: "At least one number",
      test: (p) => /[0-9]/.test(p),
    });
  }
  if (settings.requireSpecialChar) {
    rules.push({
      id: "special",
      label: "At least one special character",
      test: (p) => /[^a-zA-Z0-9]/.test(p),
    });
  }

  return rules;
}

// ─── Authentication ──────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createCredentialSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less")
    .trim(),
  username: z
    .string()
    .min(1, "Username is required")
    .max(100, "Username must be 100 characters or less")
    .trim(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character",
    ),
  url: z
    .string()
    .max(500, "URL must be 500 characters or less")
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(5000, "Notes must be 5000 characters or less")
    .optional()
    .or(z.literal("")),
  category: z
    .string()
    .max(50, "Category must be 50 characters or less")
    .optional()
    .or(z.literal("")),
});

export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;

export const updateCredentialSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less")
    .trim(),
  username: z
    .string()
    .min(1, "Username is required")
    .max(100, "Username must be 100 characters or less")
    .trim(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character",
    )
    .optional()
    .or(z.literal("")),
  url: z
    .string()
    .max(500, "URL must be 500 characters or less")
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(5000, "Notes must be 5000 characters or less")
    .optional()
    .or(z.literal("")),
  category: z
    .string()
    .max(50, "Category must be 50 characters or less")
    .optional()
    .or(z.literal("")),
});

export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * Builds a createUserSchema with password validation driven by SecuritySettings.
 */
export function getCreateUserSchema(settings: SecuritySettingsData) {
  return z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be 100 characters or less")
      .trim(),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .trim()
      .toLowerCase(),
    password: getPasswordValidationString(settings),
    role: z.enum(["SUPER_ADMIN", "EDITOR", "VIEWER"], {
      message: "Role is required",
    }),
  });
}

/**
 * Builds an updateUserSchema with password validation driven by SecuritySettings.
 */
export function getUpdateUserSchema(settings: SecuritySettingsData) {
  return z.object({
    id: z.string().uuid(),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be 100 characters or less")
      .trim()
      .optional(),
    email: z
      .string()
      .email("Please enter a valid email address")
      .trim()
      .toLowerCase()
      .optional(),
    role: z.enum(["SUPER_ADMIN", "EDITOR", "VIEWER"]).optional(),
    password: getPasswordValidationString(settings)
      .optional()
      .or(z.literal("")),
    forcePasswordChange: z.boolean().optional(),
  });
}

/**
 * Builds a changePasswordSchema with password validation driven by SecuritySettings.
 */
export function getChangePasswordSchema(settings: SecuritySettingsData) {
  return z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: getPasswordValidationString(settings),
      confirmPassword: z.string().min(1, "Please confirm your new password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
}

// Backward-compatible schemas (use minimum defaults for when settings aren't available)
export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or less")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character",
    ),
  role: z.enum(["SUPER_ADMIN", "EDITOR", "VIEWER"], {
    message: "Role is required",
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or less")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase()
    .optional(),
  role: z.enum(["SUPER_ADMIN", "EDITOR", "VIEWER"]).optional(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character",
    )
    .optional()
    .or(z.literal("")),
  forcePasswordChange: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ─── Password Change ─────────────────────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Shared ───────────────────────────────────────────────────────────────────

export const idSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export type IdInput = z.infer<typeof idSchema>;

// ─── Reveal ───────────────────────────────────────────────────────────────────

export const revealCredentialSchema = z.object({
  credentialId: z.string().uuid("Invalid credential ID format"),
});

export type RevealCredentialInput = z.infer<typeof revealCredentialSchema>;

// ─── Password Reset ──────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function getResetPasswordSchema(settings: SecuritySettingsData) {
  return z
    .object({
      token: z.string().min(1, "Reset token is required"),
      newPassword: getPasswordValidationString(settings),
      confirmPassword: z.string().min(1, "Please confirm your new password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
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
export const resetPasswordClientSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Security Settings ──────────────────────────────────────────────────────

export const securitySettingsSchema = z.object({
  minimumPasswordLength: z
    .number()
    .min(12, "Must be between 12 and 64")
    .max(64, "Must be between 12 and 64"),
  passwordHistory: z
    .number()
    .min(0, "Must be between 0 and 24")
    .max(24, "Must be between 0 and 24"),
  lockDuration: z
    .number()
    .min(1, "Must be between 1 and 1440 minutes")
    .max(1440, "Must be between 1 and 1440 minutes"),
  expirationDays: z
    .number()
    .min(0, "Must be between 0 and 3650")
    .max(3650, "Must be between 0 and 3650"),
  maxFailedAttempts: z
    .number()
    .min(1, "Must be between 1 and 50")
    .max(50, "Must be between 1 and 50"),
  requireSpecialChar: z.boolean(),
  requireUppercase: z.boolean(),
  requireNumber: z.boolean(),
  requireLowercase: z.boolean(),
});

export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
