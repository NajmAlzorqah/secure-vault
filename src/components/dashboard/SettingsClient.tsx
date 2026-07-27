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
import { useState, useTransition } from "react";
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
import { formatPasswordAge } from "@/lib/password-expiry";
import {
  type ChangePasswordInput,
  changePasswordSchema,
} from "@/lib/validations";

interface SettingsClientProps {
  user: {
    name: string;
    email: string;
    role: Role;
    passwordChangedAt: Date | null;
    forcePasswordChange: boolean;
  };
  passwordAgeInfo: PasswordAgeInfo;
  forceChange?: boolean;
}

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrator (Full System Control)",
  EDITOR: "Editor (Secret Reader/Writer)",
  VIEWER: "Viewer (Secret Reader Only)",
};

export function SettingsClient({
  user,
  passwordAgeInfo,
  forceChange = false,
}: SettingsClientProps) {
  const [serverState, setServerState] = useState<UserState | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
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

  const onSubmit = (data: ChangePasswordInput) => {
    setServerState(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("currentPassword", data.currentPassword);
      formData.append("newPassword", data.newPassword);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await changePassword(undefined, formData);
      if (result) {
        setServerState(result);
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            setError(field as any, { type: "server", message: messages[0] });
          });
        }
      }
    });
  };

  const handleExport = async () => {
    try {
      window.location.href = "/api/credentials/export";
    } catch (error) {
      alert("Failed to export credentials: " + error);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          System Settings
        </h1>
        <p className="text-muted-foreground">
          Manage administrative credentials and security settings.
        </p>
      </div>

      {/* Force password change banner */}
      {forceChange && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <div className="text-amber-400 mt-0.5">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-400">
              Password Change Required
            </h3>
            <p className="text-xs text-amber-200/70 mt-1">
              {passwordAgeInfo.isExpired
                ? "Your password has expired. You must change it to continue."
                : "An administrator has required you to change your password."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your current administrative profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-semibold text-white">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-sm font-semibold text-white">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Privilege Level</p>
                <p className="text-sm font-semibold text-emerald-400">
                  {roleLabels[user.role]}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Session Expiration
                </p>
                <p className="text-sm text-gray-300">
                  24 Hours (HttpOnly, SameSite=Strict)
                </p>
              </div>

              {/* Password Age */}
              <div className="pt-2 border-t border-zinc-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <p className="text-xs text-muted-foreground">Password Age</p>
                </div>
                {passwordAgeInfo.changedAt ? (
                  <div className="space-y-1.5">
                    <p className="text-sm text-white">
                      Changed {formatPasswordAge(passwordAgeInfo.ageInDays)}
                    </p>
                    {passwordAgeInfo.expirationDays > 0 && (
                      <div>
                        {passwordAgeInfo.isExpired ? (
                          <p className="text-xs text-red-400 font-medium">
                            Expired{" "}
                            {passwordAgeInfo.daysUntilExpiry === 0
                              ? ""
                              : `${Math.abs(passwordAgeInfo.daysUntilExpiry ?? 0)} days ago`}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400">
                            Expires in {passwordAgeInfo.daysUntilExpiry} day
                            {(passwordAgeInfo.daysUntilExpiry ?? 0) !== 1
                              ? "s"
                              : ""}
                          </p>
                        )}
                        {/* Progress bar */}
                        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              passwordAgeInfo.isExpired
                                ? "bg-red-500"
                                : (passwordAgeInfo.daysUntilExpiry ?? 0) <
                                    passwordAgeInfo.expirationDays * 0.2
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
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
                  <p className="text-sm text-amber-400">
                    No password change recorded
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export backup (SUPER_ADMIN only) */}
          {isSuperAdmin && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-emerald-400" />
                  Backup & Recovery
                </CardTitle>
                <CardDescription>
                  Export encrypted credentials database backup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Download the entire credentials vault as a JSON file. The
                  passwords will remain AES-256-GCM encrypted. This backup can
                  be decrypted only with the master server key.
                </p>
                <Button
                  onClick={handleExport}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Vault Backup
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Change Password */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-400" />
              Change Password
            </CardTitle>
            <CardDescription>
              {forceChange
                ? "You must change your password to continue."
                : "Update your password. You will be logged out upon success."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serverState?.message && (
              <div
                className={`p-3 rounded text-xs mb-4 ${serverState.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
              >
                {serverState.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    className={`pr-10 bg-background/50 border focus:ring-1 transition-colors duration-200 ${
                      errors.currentPassword
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : currentPasswordValue
                          ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                          : "border-border/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                    disabled={isPending}
                    {...register("currentPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-red-400">
                    {errors.currentPassword.message}
                  </p>
                )}
                {serverState?.errors?.currentPassword &&
                  !errors.currentPassword && (
                    <p className="text-xs text-red-400">
                      {serverState.errors.currentPassword[0]}
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    className={`pr-10 bg-background/50 border focus:ring-1 transition-colors duration-200 ${
                      errors.newPassword
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : newPasswordValue
                          ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                          : "border-border/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                    disabled={isPending}
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-400">
                    {errors.newPassword.message}
                  </p>
                )}
                {serverState?.errors?.newPassword && !errors.newPassword && (
                  <div className="text-xs text-red-400 space-y-1">
                    {serverState.errors.newPassword.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}
                <PasswordRules password={newPasswordValue} showAlways={true} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    className={`pr-10 bg-background/50 border focus:ring-1 transition-colors duration-200 ${
                      errors.confirmPassword
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : confirmPasswordValue
                          ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                          : "border-border/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                    disabled={isPending}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
                {serverState?.errors?.confirmPassword &&
                  !errors.confirmPassword && (
                    <p className="text-xs text-red-400">
                      {serverState.errors.confirmPassword[0]}
                    </p>
                  )}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Password history notice */}
      {forceChange && (
        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            Skip for now (not recommended)
          </Link>
        </div>
      )}
    </div>
  );
}
