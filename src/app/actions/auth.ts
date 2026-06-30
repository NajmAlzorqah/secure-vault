"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit, LOGIN_RATE_LIMIT } from "@/lib/rate-limit";

export interface AuthState {
	errors?: {
		email?: string[];
		password?: string[];
	};
	message?: string;
}

export async function login(
	prevState: AuthState | undefined,
	formData: FormData,
): Promise<AuthState> {
	// Get client info for audit logging
	const headersList = await headers();
	const ipAddress =
		headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		headersList.get("x-real-ip") ??
		"unknown";
	const userAgent = headersList.get("user-agent") ?? "unknown";

	// Rate limiting by IP
	const rateLimitResult = checkRateLimit(`login:${ipAddress}`, LOGIN_RATE_LIMIT);
	if (!rateLimitResult.success) {
		return {
			message: `Too many login attempts. Please try again after ${rateLimitResult.resetAt.toLocaleTimeString()}.`,
		};
	}

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
		},
	});

	if (!user) {
		// Don't reveal whether the email exists
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

	// Verify password
	const passwordValid = await verifyPassword(password, user.passwordHash);

	if (!passwordValid) {
		await logAudit({
			userId: user.id,
			action: "LOGIN_FAILED",
			details: "Invalid password",
			ipAddress,
			userAgent,
		});
		return {
			message: "Invalid email or password.",
		};
	}

	// Create session
	await createSession(user.id, user.role);

	// Audit log
	await logAudit({
		userId: user.id,
		action: "LOGIN",
		details: `User ${user.email} logged in`,
		ipAddress,
		userAgent,
	});

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
