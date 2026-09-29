"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { changePassword, type UserState } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordRules } from "@/components/ui/PasswordRules";
import type { Role } from "@/generated/prisma/client";
import type { PasswordAgeInfo } from "@/lib/password-expiry";
import type { SecuritySettingsData } from "@/lib/security-settings";
import {
  type ChangePasswordInput,
  getChangePasswordSchema,
} from "@/lib/validations";

interface SettingsClientProps {
  user: {
    name: string;
    email: string;
    role: Role;
    passwordChangedAt: Date | null;
    forcePasswordChange: boolean;
  };
  settings: SecuritySettingsData;
  passwordAgeInfo: PasswordAgeInfo;
  forceChange?: boolean;
}

export function SettingsClient({
  user,
  settings,
  passwordAgeInfo,
  forceChange = false,
}: SettingsClientProps) {
  const t = useTranslations("settings");
  const tv = useTranslations("validation");
  const locale = useLocale();

  const [serverState, setServerState] = useState<UserState | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const schema = useMemo(
    () => getChangePasswordSchema(settings)(tv),
    [settings, tv],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const currentPasswordValue = watch("currentPassword");
  const newPasswordValue = watch("newPassword");
  const confirmPasswordValue = watch("confirmPassword");

  const formatAge = (ageInDays: number): string => {
    if (ageInDays === 0) return t("today");

    let segments: string[];
    if (ageInDays < 30) {
      segments = [t("durationDays", { count: ageInDays })];
    } else if (ageInDays < 365) {
      const months = Math.floor(ageInDays / 30);
      const remainingDays = ageInDays % 30;
      segments = [t("durationMonths", { count: months })];
      if (remainingDays > 0) {
        segments.push(t("durationDays", { count: remainingDays }));
      }
    } else {
      const years = Math.floor(ageInDays / 365);
      const remainingMonths = Math.floor((ageInDays % 365) / 30);
      segments = [t("durationYears", { count: years })];
      if (remainingMonths > 0) {
        segments.push(t("durationMonths", { count: remainingMonths }));
      }
    }

    const joiner = locale === "ar" ? " و" : " and ";
    return segments.join(joiner);
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/credentials/export");
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? t("exportFailed"));
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `credentials-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      alert(t("exportFailed"));
    }
  };

  const onSubmit = (data: ChangePasswordInput) => {
    setServerState(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("currentPassword", data.currentPassword);
      formData.append("newPassword", data.newPassword);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await changePassword(undefined, formData);
      if (result) {
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setError(field as any, {
                type: "server",
                message: messages[0],
              });
            }
          });
        }
        setServerState(result);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Profile Overview */}
          <Card className="border-border/80 bg-card shadow-card">
            <CardHeader className="pb-3 border-b border-dashed border-border/80">
              <CardTitle className="flex items-center gap-2 text-foreground font-extrabold">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {t("profileTitle")}
              </CardTitle>
              <CardDescription>{t("profileDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
                  {t("nameLabel")}
                </p>
                <p className="text-sm font-bold text-foreground mt-0.5">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
                  {t("emailLabel")}
                </p>
                <p className="text-sm font-bold text-foreground mt-0.5" dir="ltr">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
                  {t("privilegeLabel")}
                </p>
                <p className="text-sm font-extrabold text-primary mt-0.5">
                  {user.role === "SUPER_ADMIN"
                    ? t("roleSuperAdmin")
                    : user.role === "EDITOR"
                      ? t("roleEditor")
                      : t("roleViewer")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
                  {t("sessionLabel")}
                </p>
                <p className="text-sm text-foreground/80 font-medium mt-0.5">{t("sessionValue")}</p>
              </div>

              {/* Password Age */}
              <div className="pt-3 border-t border-dashed border-border/60">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase">
                    {t("passwordAgeLabel")}
                  </p>
                </div>
                {passwordAgeInfo.changedAt ? (
                  <div className="space-y-2 mt-2">
                    <p className="text-sm font-bold text-foreground">
                      {t("changed", {
                        value: formatAge(passwordAgeInfo.ageInDays),
                      })}
                    </p>
                    {passwordAgeInfo.expirationDays > 0 && (
                      <div className="space-y-1">
                        {passwordAgeInfo.isExpired ? (
                          <p className="text-xs text-coral font-bold">
                            {(passwordAgeInfo.daysUntilExpiry ?? 0) === 0
                              ? t("expired")
                              : t("expiredAgo", {
                                  count: Math.abs(
                                    passwordAgeInfo.daysUntilExpiry ?? 0,
                                  ),
                                })}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground font-medium">
                            {t("expiresIn", {
                              count: passwordAgeInfo.daysUntilExpiry ?? 0,
                            })}
                          </p>
                        )}
                        {/* Progress bar */}
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              passwordAgeInfo.isExpired
                                ? "bg-coral shadow-coral-glow/50"
                                : (passwordAgeInfo.daysUntilExpiry ?? 0) <
                                    passwordAgeInfo.expirationDays * 0.2
                                  ? "bg-gold shadow-accent-glow/50"
                                  : "bg-primary shadow-teal-glow/50"
                            }`}
                            style={{
                              width: `${Math.min(100, ((passwordAgeInfo.expirationDays - (passwordAgeInfo.daysUntilExpiry ?? 0)) / passwordAgeInfo.expirationDays) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-[#8F7000] dark:text-gold-light mt-1">
                    {t("noPasswordRecord")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export backup (SUPER_ADMIN only) */}
          {isSuperAdmin && (
            <Card className="border-border/80 bg-card shadow-card">
              <CardHeader className="pb-3 border-b border-dashed border-border/80">
                <CardTitle className="flex items-center gap-2 text-foreground font-extrabold">
                  <Download className="h-5 w-5 text-primary" />
                  {t("backupTitle")}
                </CardTitle>
                <CardDescription>{t("backupDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {t("backupInfo")}
                </p>
                <Button
                  onClick={handleExport}
                  variant="gold"
                  className="w-full h-11 text-base font-bold shadow-accent-glow cursor-pointer gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t("exportBackup")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Change Password */}
        <Card className="border-border/80 bg-card shadow-card">
          <CardHeader className="pb-3 border-b border-dashed border-border/80">
            <CardTitle className="flex items-center gap-2 text-foreground font-extrabold">
              <KeyRound className="h-5 w-5 text-primary" />
              {t("changePasswordTitle")}
            </CardTitle>
            <CardDescription>
              {forceChange
                ? t("changePasswordRequired")
                : t("changePasswordOptional")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {serverState?.message && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium mb-4 ${
                  serverState.success
                    ? "bg-primary/15 text-teal-dark dark:text-teal-light border border-primary/30"
                    : "bg-coral/15 text-coral-dark dark:text-coral-light border border-coral/30"
                }`}
              >
                {serverState.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
                  {t("currentPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    className="pe-10"
                    disabled={isPending}
                    {...register("currentPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute end-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-coral font-medium mt-1">
                    {errors.currentPassword.message}
                  </p>
                )}
                {serverState?.errors?.currentPassword &&
                  !errors.currentPassword && (
                    <p className="text-xs text-coral font-medium mt-1">
                      {serverState.errors.currentPassword[0]}
                    </p>
                  )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
                  {t("newPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    className="pe-10"
                    disabled={isPending}
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute end-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-coral font-medium mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
                {serverState?.errors?.newPassword && !errors.newPassword && (
                  <div className="text-xs text-coral font-medium space-y-1 mt-1">
                    {serverState.errors.newPassword.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}
                <PasswordRules password={newPasswordValue} showAlways={true} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
                  {t("confirmPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    className="pe-10"
                    disabled={isPending}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute end-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-coral font-medium mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
                {serverState?.errors?.confirmPassword &&
                  !errors.confirmPassword && (
                    <p className="text-xs text-coral font-medium mt-1">
                      {serverState.errors.confirmPassword[0]}
                    </p>
                  )}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 text-base font-bold shadow-teal-glow cursor-pointer mt-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    {t("updating")}
                  </>
                ) : (
                  t("updatePassword")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Password history notice */}
      {forceChange && (
        <div className="text-center pt-2">
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            {t("skipForNow")}
          </Link>
        </div>
      )}
    </div>
  );
}
