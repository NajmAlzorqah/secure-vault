"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, requireRole, verifyPassword, verifySession } from "@/lib/auth";
import { deleteSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { createUserSchema, updateUserSchema, changePasswordSchema } from "@/lib/validations";

export interface UserState {
	errors?: Record<string, string[]>;
	message?: string;
	success?: boolean;
}

async function getClientInfo() {
	const headersList = await headers();
	const ipAddress =
		headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		headersList.get("x-real-ip") ??
		"unknown";
	const userAgent = headersList.get("user-agent") ?? "unknown";
	return { ipAddress, userAgent };
}

export async function createUser(
	prevState: UserState | undefined,
	formData: FormData,
): Promise<UserState> {
	const session = await requireRole(["SUPER_ADMIN"]);
	const { ipAddress, userAgent } = await getClientInfo();

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
		data: { name, email, passwordHash, role },
	});

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
	prevState: UserState | undefined,
	formData: FormData,
): Promise<UserState> {
	const session = await requireRole(["SUPER_ADMIN"]);
	const { ipAddress, userAgent } = await getClientInfo();

	const parsed = updateUserSchema.safeParse({
		id: formData.get("id"),
		name: formData.get("name"),
		email: formData.get("email"),
		role: formData.get("role"),
		password: formData.get("password"),
	});

	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { id, name, email, role, password } = parsed.data;

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
	if (password && password.length > 0) {
		updateData.passwordHash = await hashPassword(password);
	}

	await db.user.update({ where: { id }, data: updateData });

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
	prevState: UserState | undefined,
	formData: FormData,
): Promise<UserState> {
	const session = await verifySession();
	const { ipAddress, userAgent } = await getClientInfo();

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

	// Update password
	const newHash = await hashPassword(newPassword);
	await db.user.update({
		where: { id: session.userId },
		data: { passwordHash: newHash },
	});

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
