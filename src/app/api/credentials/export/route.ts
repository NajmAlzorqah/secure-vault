import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
	try {
		// Only SUPER_ADMIN is authorized to export credentials
		const session = await requireRole(["SUPER_ADMIN"]);

		const credentials = await db.credential.findMany({
			orderBy: { updatedAt: "desc" },
		});

		// Log audit event
		const headersList = await headers();
		const ipAddress =
			headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			headersList.get("x-real-ip") ??
			"unknown";
		const userAgent = headersList.get("user-agent") ?? "unknown";

		await logAudit({
			userId: session.userId,
			action: "EXPORT_CREDENTIALS",
			details: `Exported ${credentials.length} credentials as encrypted backup JSON`,
			ipAddress,
			userAgent,
		});

		// Return credentials database representation (encrypted)
		return new Response(JSON.stringify(credentials, null, 2), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Content-Disposition": `attachment; filename="securevault-backup-${new Date().toISOString().split("T")[0]}.json"`,
			},
		});
	} catch (error) {
		console.error("[EXPORT ERROR] Failed to export credentials:", error);
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
}
