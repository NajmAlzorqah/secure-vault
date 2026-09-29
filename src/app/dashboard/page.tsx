import { Activity, ClipboardList, KeyRound, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { AuditAction } from "@/generated/prisma/client";
import { intlLocaleFor } from "@/i18n/config";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const ta = await getTranslations("auditActions");
  const tc = await getTranslations("common");
  const locale = await getLocale();

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
    LOGIN: "text-primary font-bold",
    LOGOUT: "text-muted-foreground font-semibold",
    LOGIN_FAILED: "text-coral font-bold",
    VIEW_PASSWORD: "text-[#8F7000] dark:text-gold-light font-bold",
    CREATE_CREDENTIAL: "text-primary font-bold",
    UPDATE_CREDENTIAL: "text-[#1B6CA8] dark:text-sky-blue font-bold",
    DELETE_CREDENTIAL: "text-coral font-bold",
    CREATE_USER: "text-primary font-bold",
    UPDATE_USER: "text-[#1B6CA8] dark:text-sky-blue font-bold",
    DELETE_USER: "text-coral font-bold",
    CHANGE_PASSWORD: "text-[#8F7000] dark:text-gold-light font-bold",
    EXPORT_CREDENTIALS: "text-[#1B6CA8] dark:text-sky-blue font-bold",
    PASSWORD_RESET_REQUEST: "text-[#8F7000] dark:text-gold-light font-bold",
    PASSWORD_RESET_COMPLETE: "text-primary font-bold",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card border border-border/80 rounded-2xl p-5 flex items-center gap-4 shadow-card hover:scale-[1.01] transition-all duration-150">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-teal-glow/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
              {t("storedCredentials")}
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5 font-heading">
              {credentialCount}
            </p>
          </div>
        </div>

        {userCount !== null && (
          <div className="bg-card border border-border/80 rounded-2xl p-5 flex items-center gap-4 shadow-card hover:scale-[1.01] transition-all duration-150">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gold/15 border border-gold/30 text-[#8F7000] dark:text-gold-light shadow-accent-glow/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
                {t("registeredUsers")}
              </p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5 font-heading">
                {userCount}
              </p>
            </div>
          </div>
        )}

        {auditCount !== null && (
          <div className="bg-card border border-border/80 rounded-2xl p-5 flex items-center gap-4 shadow-card hover:scale-[1.01] transition-all duration-150">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-blue/15 border border-sky-blue/30 text-[#1B6CA8] dark:text-sky-blue shadow-sky-glow/20">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
                {t("auditEvents")}
              </p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5 font-heading">
                {auditCount}
              </p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border/80 rounded-2xl p-5 flex items-center gap-4 shadow-card hover:scale-[1.01] transition-all duration-150">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-teal-glow/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
              {t("securityStatus")}
            </p>
            <p className="text-lg font-extrabold text-primary mt-0.5 font-heading">
              {t("active")}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-dashed border-border/80">
          <h2 className="text-lg font-extrabold text-foreground font-heading">
            {t("recentActivity")}
          </h2>
        </div>
        <div className="p-6">
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 font-medium">{t("noActivity")}</p>
          ) : (
            <div className="space-y-6">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex gap-4 relative">
                  <div className="w-3.5 h-3.5 rounded-full bg-primary/20 border-2 border-primary mt-1 shrink-0 z-10" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      <span className={actionColors[log.action] ?? "text-foreground"}>
                        {ta(log.action)}
                      </span>
                      {log.target && (
                        <span className="text-muted-foreground font-medium">
                          {" "}
                          — {log.target.title}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {log.user?.email ?? tc("system")} •{" "}
                      {new Date(log.timestamp).toLocaleString(
                        intlLocaleFor(locale),
                      )}
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
