import { SecurityDashboardClient } from "@/components/dashboard/SecurityDashboardClient";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSecuritySettings } from "@/lib/security-settings";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  await requireRole(["SUPER_ADMIN"]);

  const settings = await getSecuritySettings();

  const [
    totalUsers,
    lockedUsers,
    recentFailedAttempts,
    usersWithExpiredPasswords,
    recentAuditLogs,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { lockedUntil: { gt: new Date() } } }),
    db.failedLoginAttempt.count({
      where: {
        attemptedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    // Users with passwords older than expiration days (or no passwordChangedAt)
    settings.expirationDays > 0
      ? db.user.count({
          where: {
            OR: [
              { passwordChangedAt: null },
              {
                passwordChangedAt: {
                  lt: new Date(
                    Date.now() - settings.expirationDays * 24 * 60 * 60 * 1000,
                  ),
                },
              },
            ],
          },
        })
      : 0,
    db.auditLog.findMany({
      take: 20,
      orderBy: { timestamp: "desc" },
      where: {
        action: {
          in: [
            "LOGIN_FAILED",
            "PASSWORD_RESET_REQUEST",
            "PASSWORD_RESET_COMPLETE",
          ],
        },
      },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  return (
    <SecurityDashboardClient
      settings={settings}
      stats={{
        totalUsers,
        lockedUsers,
        recentFailedAttempts,
        usersWithExpiredPasswords,
      }}
      recentSecurityEvents={recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        userEmail: log.user?.email ?? "Unknown",
        timestamp: log.timestamp.toISOString(),
        ipAddress: log.ipAddress,
      }))}
    />
  );
}
