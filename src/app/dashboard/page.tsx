import { Activity, ClipboardList, KeyRound, Users } from "lucide-react";
import type { AuditAction } from "@/generated/prisma/client";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await verifySession();

  const [credentialCount, recentLogs] = await Promise.all([
    db.credential.count(),
    db.auditLog.findMany({
      take: 8,
      orderBy: { timestamp: "desc" },
      where:
        session.role !== "SUPER_ADMIN" ? { userId: session.userId } : undefined,
      include: {
        user: { select: { email: true, name: true } },
        target: { select: { title: true } },
      },
    }),
  ]);

  const userCount =
    session.role === "SUPER_ADMIN" ? await db.user.count() : null;

  const auditCount =
    session.role === "SUPER_ADMIN" ? await db.auditLog.count() : null;

  const actionColors: Record<AuditAction, string> = {
    LOGIN: "text-emerald-400",
    LOGOUT: "text-zinc-400",
    LOGIN_FAILED: "text-red-400",
    VIEW_PASSWORD: "text-amber-400",
    CREATE_CREDENTIAL: "text-blue-400",
    UPDATE_CREDENTIAL: "text-purple-400",
    DELETE_CREDENTIAL: "text-red-400",
    CREATE_USER: "text-emerald-400",
    UPDATE_USER: "text-purple-400",
    DELETE_USER: "text-red-400",
    CHANGE_PASSWORD: "text-amber-400",
    EXPORT_CREDENTIALS: "text-blue-400",
    PASSWORD_RESET_REQUEST: "text-amber-400",
    PASSWORD_RESET_COMPLETE: "text-emerald-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="text-zinc-400">
          Overview of your password vault activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 shadow-lg">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">
              Stored Credentials
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {credentialCount}
            </p>
          </div>
        </div>

        {userCount !== null && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">
                Registered Users
              </p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {userCount}
              </p>
            </div>
          </div>
        )}

        {auditCount !== null && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Audit Events</p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {auditCount}
              </p>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 shadow-lg">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/10 border border-emerald-500/20 text-amber-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Security Status</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">Active</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            Recent Security Activity
          </h2>
        </div>
        <div className="p-6">
          {recentLogs.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              No recent activity recorded.
            </p>
          ) : (
            <div className="space-y-6">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex gap-4 relative">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30 border-2 border-emerald-500 mt-1 shrink-0 z-10" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">
                      <span
                        className={actionColors[log.action] ?? "text-zinc-300"}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                      {log.target && (
                        <span className="text-zinc-400">
                          {" "}
                          — {log.target.title}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {log.user?.email ?? "System"} •{" "}
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
