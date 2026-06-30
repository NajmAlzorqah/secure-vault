import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await verifySession();

	const user = await db.user.findUnique({
		where: { id: session.userId },
		select: { id: true, name: true, email: true, role: true },
	});

	if (!user) {
		return null;
	}

	return (
		<div className="flex min-h-screen bg-zinc-950 text-white">
			<Sidebar role={user.role} />
			<div className="flex-grow flex flex-col min-w-0">
				<TopBar user={user} />
				<main className="flex-grow p-8 overflow-y-auto">{children}</main>
			</div>
		</div>
	);
}
