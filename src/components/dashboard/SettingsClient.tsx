"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
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
import {
  type ChangePasswordInput,
  changePasswordSchema,
} from "@/lib/validations";

interface SettingsClientProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
}

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrator (Full System Control)",
  EDITOR: "Editor (Secret Reader/Writer)",
  VIEWER: "Viewer (Secret Reader Only)",
};

export function SettingsClient({ user }: SettingsClientProps) {
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
              Update your password. You will be logged out upon success.
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
    </div>
  );
}
