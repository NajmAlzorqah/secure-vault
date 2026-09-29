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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const actionBadgeVariant: Record<string, "coral" | "gold" | "default"> = {
  LOGIN_FAILED: "coral",
  PASSWORD_RESET_REQUEST: "gold",
  PASSWORD_RESET_COMPLETE: "default",
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
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Security Score */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-5">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-2xl ${
              securityScore >= 80
                ? "bg-primary/15 border border-primary/30 shadow-teal-glow/20"
                : securityScore >= 50
                  ? "bg-gold/15 border border-gold/30 shadow-accent-glow/20"
                  : "bg-coral/15 border border-coral/30 shadow-coral-glow/20"
            }`}
          >
            <ShieldCheck
              className={`h-8 w-8 ${
                securityScore >= 80
                  ? "text-primary"
                  : securityScore >= 50
                    ? "text-[#8F7000] dark:text-gold-light"
                    : "text-coral"
              }`}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
              {t("scoreLabel")}
            </p>
            <p
              className={`text-3xl font-extrabold font-heading ${
                securityScore >= 80
                  ? "text-primary"
                  : securityScore >= 50
                    ? "text-[#8F7000] dark:text-gold-light"
                    : "text-coral"
              }`}
            >
              {securityScore}%
            </p>
          </div>
          <div className="ms-auto text-end">
            <p className="text-xs text-muted-foreground font-semibold">
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
          color="sky"
        />
        <StatCard
          icon={<ShieldOff className="h-5 w-5" />}
          label={t("lockedAccounts")}
          value={stats.lockedUsers}
          color={stats.lockedUsers > 0 ? "coral" : "teal"}
        />
        <StatCard
          icon={<FileWarning className="h-5 w-5" />}
          label={t("failedLogins")}
          value={stats.recentFailedAttempts}
          color={stats.recentFailedAttempts > 10 ? "coral" : "gold"}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label={t("expiredPasswords")}
          value={stats.usersWithExpiredPasswords}
          color={stats.usersWithExpiredPasswords > 0 ? "coral" : "teal"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Policy */}
        <div className="bg-card border border-border/80 rounded-2xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-dashed border-border/80 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-foreground font-heading flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t("policyTitle")}
            </h2>
            <Link href="/dashboard/security/settings">
              <Button variant="outline" size="sm" className="gap-1.5 font-bold cursor-pointer">
                <Settings className="h-3.5 w-3.5" />
                {t("configure")}
              </Button>
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
        <div className="bg-card border border-border/80 rounded-2xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-dashed border-border/80">
            <h2 className="text-lg font-extrabold text-foreground font-heading flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {t("eventsTitle")}
            </h2>
          </div>
          <div className="p-6">
            {recentSecurityEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm font-medium">
                {t("noEvents")}
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentSecurityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 bg-muted/30 border border-border/80 rounded-xl"
                  >
                    <Badge
                      variant={actionBadgeVariant[event.action] ?? "default"}
                      className="shrink-0"
                    >
                      {ta(event.action)}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground font-medium truncate">
                        {event.details || t("noDetails")}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
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
  color: "sky" | "coral" | "teal" | "gold";
}) {
  const colorMap: Record<string, string> = {
    sky: "bg-sky-blue/15 border-sky-blue/30 text-[#1B6CA8] dark:text-sky-blue",
    coral: "bg-coral/15 border-coral/30 text-coral",
    teal: "bg-primary/15 border-primary/30 text-primary",
    gold: "bg-gold/15 border-gold/30 text-[#8F7000] dark:text-gold-light",
  };

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-card hover:scale-[1.01] transition-all duration-150">
      <div
        className={`flex items-center justify-center w-11 h-11 rounded-xl border ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">{label}</p>
        <p className="text-2xl font-extrabold text-foreground font-heading">{value}</p>
      </div>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-xs font-bold text-foreground">{value}</span>
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
