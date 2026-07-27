"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { logAudit } from "@/lib/audit";
import {
  hashPassword,
  requireRole,
  verifyPassword,
  verifySession,
} from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isPasswordReused,
  recordPasswordHistory,
} from "@/lib/password-history";
import { getSecuritySettings } from "@/lib/security-settings";
import { deleteSession } from "@/lib/session";
import {
  getChangePasswordSchema,
  getCreateUserSchema,
  getUpdateUserSchema,
  idSchema,
} from "@/lib/validations";

export interface UserState {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
}

export async function getClientInfo() {
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";
  const userAgent = headersList.get("user-agent") ?? "unknown";
  return { ipAddress, userAgent };
}

export async function createUser(
  _prevState: UserState | undefined,
  formData: FormData,
): Promise<UserState> {
  const session = await requireRole(["SUPER_ADMIN"]);
  const { ipAddress, userAgent } = await getClientInfo();
  const settings = await getSecuritySettings();

  const createUserSchema = getCreateUserSchema(settings);
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, role } = parsed.data;

  // Check for duplicate email
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { message: "A user with this email already exists." };
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      passwordChangedAt: new Date(),
    },
  });

  // Record initial password in history
  await recordPasswordHistory(user.id, passwordHash, settings);

  await logAudit({
    userId: session.userId,
    action: "CREATE_USER",
    details: `Created user: ${email} with role ${role}`,
    ipAddress,
    userAgent,
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");

  return { success: true, message: `User ${email} created successfully.` };
}

export async function updateUser(
  _prevState: UserState | undefined,
  formData: FormData,
): Promise<UserState> {
  const session = await requireRole(["SUPER_ADMIN"]);
  const { ipAddress, userAgent } = await getClientInfo();
  const settings = await getSecuritySettings();

  const updateUserSchema = getUpdateUserSchema(settings);
  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password") ?? "",
    forcePasswordChange: formData.get("forcePasswordChange") === "on",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { id, name, email, role, password, forcePasswordChange } = parsed.data;

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return { message: "User not found." };
  }

  // Check for duplicate email (if changed)
  if (email && email !== existing.email) {
    const emailTaken = await db.user.findUnique({ where: { email } });
    if (emailTaken) {
      return { message: "A user with this email already exists." };
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;

  if (forcePasswordChange !== undefined) {
    updateData.forcePasswordChange = forcePasswordChange;
  }

  if (password && password.length > 0) {
    // Check password history for the target user
    const historyCheck = await isPasswordReused(id, password, settings);
    if (historyCheck.reused) {
      return { message: historyCheck.message };
    }

    const newHash = await hashPassword(password);
    updateData.passwordHash = newHash;
    updateData.passwordChangedAt = new Date();

    await db.user.update({ where: { id }, data: updateData });

    // Record in history after successful update
    await recordPasswordHistory(id, newHash, settings);
  } else {
    await db.user.update({ where: { id }, data: updateData });
  }

  await logAudit({
    userId: session.userId,
    action: "UPDATE_USER",
    details: `Updated user: ${existing.email}`,
    ipAddress,
    userAgent,
  });

  revalidatePath("/dashboard/users");

  return { success: true, message: "User updated successfully." };
}

export async function deleteUser(id: string): Promise<UserState> {
  const session = await requireRole(["SUPER_ADMIN"]);
  const { ipAddress, userAgent } = await getClientInfo();

  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) {
    return { message: "Invalid user ID format." };
  }

  // Prevent self-deletion
  if (id === session.userId) {
    return { message: "You cannot delete your own account." };
  }

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return { message: "User not found." };
  }

  await db.user.delete({ where: { id } });

  await logAudit({
    userId: session.userId,
    action: "DELETE_USER",
    details: `Deleted user: ${user.email} (${user.role})`,
    ipAddress,
    userAgent,
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");

  return { success: true, message: `User ${user.email} deleted.` };
}

export async function changePassword(
  _prevState: UserState | undefined,
  formData: FormData,
): Promise<UserState> {
  const session = await verifySession();
  const { ipAddress, userAgent } = await getClientInfo();
  const settings = await getSecuritySettings();

  const changePasswordSchema = getChangePasswordSchema(settings);
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { currentPassword, newPassword } = parsed.data;

  // Verify current password
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true, email: true },
  });

  if (!user) {
    return { message: "User not found." };
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return { message: "Current password is incorrect." };
  }

  // Check password history
  const historyCheck = await isPasswordReused(
    session.userId,
    newPassword,
    settings,
  );
  if (historyCheck.reused) {
    return { message: historyCheck.message };
  }

  // Update password and invalidate all existing sessions
  const newHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: session.userId },
    data: {
      passwordHash: newHash,
      sessionVersion: { increment: 1 },
      passwordChangedAt: new Date(),
      forcePasswordChange: false,
    },
  });

  // Record in history
  await recordPasswordHistory(session.userId, newHash, settings);

  await logAudit({
    userId: session.userId,
    action: "CHANGE_PASSWORD",
    details: "Password changed",
    ipAddress,
    userAgent,
  });

  // Force re-login after password change for security
  await deleteSession();

  return { success: true, message: "Password changed. Please log in again." };
}

/**
 * Forces a password change (e.g. expired password or admin-forced).
 * Does NOT require current password and does NOT delete the session.
 * Used by the mandatory password change dialog on login.
 */
export async function forceChangePassword(
  _prevState: UserState | undefined,
  formData: FormData,
): Promise<UserState> {
  const session = await verifySession();
  const { ipAddress, userAgent } = await getClientInfo();
  const settings = await getSecuritySettings();

  const schema = getChangePasswordSchema(settings);
  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true, email: true },
  });

  if (!user) {
    return { message: "User not found." };
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return { message: "Current password is incorrect." };
  }

  const historyCheck = await isPasswordReused(
    session.userId,
    newPassword,
    settings,
  );
  if (historyCheck.reused) {
    return { message: historyCheck.message };
  }

  const newHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: session.userId },
    data: {
      passwordHash: newHash,
      passwordChangedAt: new Date(),
      forcePasswordChange: false,
    },
  });

  await recordPasswordHistory(session.userId, newHash, settings);

  await logAudit({
    userId: session.userId,
    action: "CHANGE_PASSWORD",
    details: "Password changed (forced)",
    ipAddress,
    userAgent,
  });

  revalidatePath("/dashboard");

  return { success: true, message: "Password changed successfully." };
}
