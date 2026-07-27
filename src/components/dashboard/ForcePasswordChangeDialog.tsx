"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { forceChangePassword, type UserState } from "@/app/actions/users";
import type { SecuritySettingsData } from "@/lib/security-settings";
import { getChangePasswordSchema } from "@/lib/validations";

interface ForcePasswordChangeDialogProps {
  settings: SecuritySettingsData;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ForcePasswordChangeDialog({
  settings,
}: ForcePasswordChangeDialogProps) {
  const [serverState, setServerState] = useState<UserState | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const schema = getChangePasswordSchema(settings);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordForm>({
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

  const onSubmit = (data: PasswordForm) => {
    setServerState(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("currentPassword", data.currentPassword);
      formData.append("newPassword", data.newPassword);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await forceChangePassword(undefined, formData);
      if (result) {
        setServerState(result);
        if (result.success) {
          router.refresh();
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <ShieldAlert className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Password Change Required
          </h2>
          <p className="text-sm text-zinc-400">
            Your password has expired or an administrator has requested a
            password change. Please set a new password to continue.
          </p>
        </div>

        {/* Server message */}
        {serverState?.message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              serverState.success
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {serverState.message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="fp-currentPassword"
              className="text-xs font-medium text-zinc-400"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                id="fp-currentPassword"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter current password"
                className={`w-full bg-zinc-950 border rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                  errors.currentPassword
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : currentPasswordValue
                      ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                disabled={isPending}
                {...register("currentPassword")}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white cursor-pointer"
                tabIndex={-1}
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
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="fp-newPassword"
              className="text-xs font-medium text-zinc-400"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="fp-newPassword"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter new password"
                className={`w-full bg-zinc-950 border rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                  errors.newPassword
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : newPasswordValue
                      ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                disabled={isPending}
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white cursor-pointer"
                tabIndex={-1}
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
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="fp-confirmPassword"
              className="text-xs font-medium text-zinc-400"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="fp-confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm new password"
                className={`w-full bg-zinc-950 border rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                  errors.confirmPassword
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : confirmPasswordValue
                      ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                disabled={isPending}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white cursor-pointer"
                tabIndex={-1}
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
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-zinc-500">
          You must change your password before continuing.
        </p>
      </div>
    </div>
  );
}
