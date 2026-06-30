import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsClient } from "@/components/dashboard/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
	const session = await verifySession();

	const user = await db.user.findUnique({
		where: { id: session.userId },
		select: {
			name: true,
			email: true,
			role: true,
		},
	});

	if (!user) {
		return null;
	}

	return <SettingsClient user={user} />;
}
