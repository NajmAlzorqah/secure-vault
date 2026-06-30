import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { VaultClient } from "@/components/credential/VaultClient";

export const dynamic = "force-dynamic";

interface DbCredential {
	id: string;
	title: string;
	username: string;
	url: string | null;
	notes: string | null;
	category: string | null;
	updatedAt: Date;
}

export default async function VaultPage() {
	const session = await verifySession();

	const credentials = await db.credential.findMany({
		orderBy: { updatedAt: "desc" },
		select: {
			id: true,
			title: true,
			username: true,
			url: true,
			notes: true,
			category: true,
			updatedAt: true,
		},
	}) as DbCredential[];

	// Get unique categories for filtering
	const categories = Array.from(
		new Set(
			credentials
				.map((c: DbCredential) => c.category)
				.filter((cat: string | null): cat is string => typeof cat === "string" && cat.trim() !== ""),
		),
	);

	return (
		<VaultClient
			initialCredentials={credentials.map((c: DbCredential) => ({
				...c,
				updatedAt: c.updatedAt.toISOString(),
			}))}
			categories={categories}
			userRole={session.role}
		/>
	);
}
