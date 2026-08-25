"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { resetPassword } from "@/app/actions/password-reset";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { PasswordRules } from "@/components/ui/PasswordRules";
import {
  getResetPasswordClientSchema,
  type ResetPasswordInput,
} from "@/lib/validations";

function ResetPasswordForm() {
  const t = useTranslations("reset");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [serverState, setServerState] = useState<
    | {
        message?: string;
        success?: boolean;
      }
    | undefined
  >(undefined);
  const [isPending, startTransition] = useTransition();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const schema = useMemo(() => getResetPasswordClientSchema(tv), [tv]);

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const newPasswordValue = watch("newPassword");

  const onSubmit = (data: ResetPasswordInput) => {
    setServerState(undefined);
    startTransition(async () => {
      const result = await resetPassword(
        token,
        data.newPassword,
        data.confirmPassword,
      );
      if (result) {
        setServerState(result);
      }
    });
  };

  if (!token) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="fixed top-4 end-4 z-50">
          <LocaleSwitcher />
        </div>
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl text-center space-y-4">
            <p className="text-red-400">{t("invalidLink")}</p>
            <Link
              href="/forgot-password"
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              {t("requestNewLink")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />

      <div className="fixed top-4 end-4 z-50">
        <LocaleSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-400">{t("subtitle")}</p>
          </div>

          {/* Message */}
          {serverState?.message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                serverState.success
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
              role="alert"
            >
              {serverState.message}
            </div>
          )}

          {/* Success — link to login */}
          {serverState?.success && (
            <Link
              href="/login"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {t("goToLogin")}
            </Link>
          )}

          {/* Form (hidden after success) */}
          {!serverState?.success && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register("token")} value={token} />

              {/* New Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="newPassword"
                  className="text-xs font-medium text-zinc-400"
                >
                  {t("newPassword")}
                </label>
                <div className="relative">
                  <KeyRound className="absolute start-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full bg-zinc-950 border rounded-lg ps-10 pe-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 disabled:opacity-50 transition-colors duration-200 ${
                      errors.newPassword
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                    disabled={isPending}
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute end-3 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
                <PasswordRules password={newPasswordValue} showAlways={true} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-medium text-zinc-400"
                >
                  {t("confirmNewPassword")}
                </label>
                <div className="relative">
                  <KeyRound className="absolute start-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full bg-zinc-950 border rounded-lg ps-10 pe-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 disabled:opacity-50 transition-colors duration-200 ${
                      errors.confirmPassword
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                    disabled={isPending}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute end-3 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">
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
                    {t("resetting")}
                  </>
                ) : (
                  t("title")
                )}
              </button>
            </form>
          )}

          {/* Back to login */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center justify-center gap-1 transition-colors"
            >
              <BackIcon className="h-3 w-3" />
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
