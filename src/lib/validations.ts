import { z } from "zod";

// ─── Authentication ──────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
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
    .min(8, "Password must be at least 8 characters")
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
    .min(8, "Password must be at least 8 characters")
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
    .min(8, "Password must be at least 8 characters")
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
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character",
    )
    .optional()
    .or(z.literal("")),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ─── Password Change ─────────────────────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
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
