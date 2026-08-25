"use client";

import {
  AlertTriangle,
  Clock,
  FileWarning,
  Settings,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { intlLocaleFor } from "@/i18n/config";

interface SecurityDashboardClientProps {
  settings: {
    minimumPasswordLength: number;
    passwordHistory: number;
    lockDuration: number;
    expirationDays: number;
    maxFailedAttempts: number;
    requireSpecialChar: boolean;
    requireUppercase: boolean;
    requireNumber: boolean;
    requireLowercase: boolean;
  };
  stats: {
    totalUsers: number;
    lockedUsers: number;
    recentFailedAttempts: number;
    usersWithExpiredPasswords: number;
  };
  recentSecurityEvents: Array<{
    id: string;
    action: string;
    details: string | null;
    userEmail: string;
    timestamp: string;
    ipAddress: string | null;
  }>;
}

const actionColors: Record<string, string> = {
  LOGIN_FAILED: "text-red-400 bg-red-500/10 border-red-500/20",
  PASSWORD_RESET_REQUEST: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PASSWORD_RESET_COMPLETE:
    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export function SecurityDashboardClient({
  settings,
  stats,
  recentSecurityEvents,
}: SecurityDashboardClientProps) {
  const t = useTranslations("securityDashboard");
  const ta = useTranslations("auditActions");
  const tc = useTranslations("common");
  const locale = useLocale();

  const securityScore = calculateSecurityScore(settings, stats);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="text-zinc-400">{t("subtitle")}</p>
      </div>

      {/* Security Score */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-xl ${
              securityScore >= 80
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : securityScore >= 50
                  ? "bg-amber-500/10 border border-amber-500/20"
                  : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <ShieldCheck
              className={`h-8 w-8 ${
                securityScore >= 80
                  ? "text-emerald-400"
                  : securityScore >= 50
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">
              {t("scoreLabel")}
            </p>
            <p
              className={`text-3xl font-bold ${
                securityScore >= 80
                  ? "text-emerald-400"
                  : securityScore >= 50
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {securityScore}%
            </p>
          </div>
          <div className="ms-auto text-end">
            <p className="text-xs text-zinc-500">
              {securityScore >= 80
                ? t("scoreStrong")
                : securityScore >= 50
                  ? t("scoreModerate")
                  : t("scoreWeak")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t("totalUsers")}
          value={stats.totalUsers}
          color="blue"
        />
        <StatCard
          icon={<ShieldOff className="h-5 w-5" />}
          label={t("lockedAccounts")}
          value={stats.lockedUsers}
          color={stats.lockedUsers > 0 ? "red" : "emerald"}
        />
        <StatCard
          icon={<FileWarning className="h-5 w-5" />}
          label={t("failedLogins")}
          value={stats.recentFailedAttempts}
          color={stats.recentFailedAttempts > 10 ? "red" : "amber"}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label={t("expiredPasswords")}
          value={stats.usersWithExpiredPasswords}
          color={stats.usersWithExpiredPasswords > 0 ? "red" : "emerald"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Policy */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              {t("policyTitle")}
            </h2>
            <Link
              href="/dashboard/security/settings"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              {t("configure")}
            </Link>
          </div>
          <div className="p-6 space-y-3">
            <PolicyRow
              label={t("minLength")}
              value={t("characters", { count: settings.minimumPasswordLength })}
            />
            <PolicyRow
              label={t("history")}
              value={t("lastPasswords", { count: settings.passwordHistory })}
            />
            <PolicyRow
              label={t("lockDuration")}
              value={t("minutes", { count: settings.lockDuration })}
            />
            <PolicyRow
              label={t("expiration")}
              value={
                settings.expirationDays > 0
                  ? t("days", { count: settings.expirationDays })
                  : tc("never")
              }
            />
            <PolicyRow
              label={t("maxAttempts")}
              value={`${settings.maxFailedAttempts}`}
            />
            <PolicyRow
              label={t("requireUppercase")}
              value={settings.requireUppercase ? tc("yes") : tc("no")}
            />
            <PolicyRow
              label={t("requireLowercase")}
              value={settings.requireLowercase ? tc("yes") : tc("no")}
            />
            <PolicyRow
              label={t("requireNumber")}
              value={settings.requireNumber ? tc("yes") : tc("no")}
            />
            <PolicyRow
              label={t("requireSpecial")}
              value={settings.requireSpecialChar ? tc("yes") : tc("no")}
            />
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              {t("eventsTitle")}
            </h2>
          </div>
          <div className="p-6">
            {recentSecurityEvents.length === 0 ? (
              <p className="text-zinc-500 text-center py-8 text-sm">
                {t("noEvents")}
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentSecurityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 bg-zinc-950/40 border border-zinc-800/60 rounded-lg"
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                        actionColors[event.action] ??
                        "text-zinc-400 bg-zinc-800 border-zinc-700"
                      }`}
                    >
                      {ta(event.action)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-300 truncate">
                        {event.details || t("noDetails")}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {event.userEmail} •{" "}
                        {new Date(event.timestamp).toLocaleString(
                          intlLocaleFor(locale),
                        )}
                        {event.ipAddress && ` • ${event.ipAddress}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-lg">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-lg border ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-zinc-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-xs font-medium text-white">{value}</span>
    </div>
  );
}

function calculateSecurityScore(
  settings: SecurityDashboardClientProps["settings"],
  stats: SecurityDashboardClientProps["stats"],
): number {
  let score = 0;

  // Password length (up to 20 points)
  if (settings.minimumPasswordLength >= 12) score += 20;
  else if (settings.minimumPasswordLength >= 8) score += 10;
  else score += 5;

  // Password history (up to 15 points)
  if (settings.passwordHistory >= 5) score += 15;
  else if (settings.passwordHistory >= 3) score += 10;
  else if (settings.passwordHistory >= 1) score += 5;

  // Lock duration (up to 10 points)
  if (settings.lockDuration <= 30) score += 10;
  else if (settings.lockDuration <= 60) score += 5;

  // Expiration (up to 15 points)
  if (settings.expirationDays > 0 && settings.expirationDays <= 90) score += 15;
  else if (settings.expirationDays > 0) score += 8;

  // Character requirements (up to 20 points, 5 each)
  if (settings.requireUppercase) score += 5;
  if (settings.requireLowercase) score += 5;
  if (settings.requireNumber) score += 5;
  if (settings.requireSpecialChar) score += 5;

  // Max failed attempts (up to 10 points)
  if (settings.maxFailedAttempts <= 5) score += 10;
  else if (settings.maxFailedAttempts <= 10) score += 5;

  // Penalty for locked accounts
  if (stats.lockedUsers > 0) score -= 5;

  // Penalty for expired passwords
  if (stats.usersWithExpiredPasswords > 0) score -= 5;

  return Math.max(0, Math.min(100, score));
}
