import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersClient } from "@/components/dashboard/UsersClient";
import type { Role } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

interface DbUser {
	id: string;
	email: string;
	name: string;
	role: Role;
	createdAt: Date;
}

export default async function UsersPage() {
	// Only super_admin can access the User Management panel
	const session = await requireRole(["SUPER_ADMIN"]);

	const users = await db.user.findMany({
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
			createdAt: true,
		},
	}) as DbUser[];

	return (
		<UsersClient
			initialUsers={users.map((u: DbUser) => ({
				...u,
				createdAt: u.createdAt.toISOString(),
			}))}
			currentUserId={session.userId}
		/>
	);
}
