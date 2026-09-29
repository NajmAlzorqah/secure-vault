"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { resetPassword } from "@/app/actions/password-reset";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
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
      <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <div className="fixed top-4 end-4 z-50">
          <LocaleSwitcher />
        </div>
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-card border border-border/80 rounded-2xl p-8 shadow-card text-center space-y-4">
            <p className="text-coral font-medium">{t("invalidLink")}</p>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline font-semibold"
            >
              {t("requestNewLink")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(43,168,162,0.14),transparent_65%)] pointer-events-none" />

      <div className="fixed top-4 end-4 z-50">
        <LocaleSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card border border-border/80 rounded-2xl p-8 shadow-card space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-primary/10 border border-primary/20 rounded-2xl shadow-teal-glow/20">
              <Logo className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          {/* Message */}
          {serverState?.message && (
            <div
              className={`p-3.5 rounded-xl text-sm font-medium ${
                serverState.success
                  ? "bg-primary/15 border border-primary/30 text-teal-dark dark:text-teal-light"
                  : "bg-coral/15 border border-coral/30 text-coral-dark dark:text-coral-light"
              }`}
              role="alert"
            >
              {serverState.message}
            </div>
          )}

          {/* Success — link to login */}
          {serverState?.success && (
            <Link href="/login" className="block w-full">
              <Button className="w-full h-11 text-base font-bold shadow-teal-glow cursor-pointer">
                {t("goToLogin")}
              </Button>
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
                  className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
                >
                  {t("newPassword")}
                </label>
                <div className="relative">
                  <KeyRound className="absolute start-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder="••••••••"
                    className="ps-10 pe-10"
                    disabled={isPending}
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute end-3 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                <PasswordRules password={newPasswordValue} showAlways={true} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
                >
                  {t("confirmNewPassword")}
                </label>
                <div className="relative">
                  <KeyRound className="absolute start-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className="ps-10 pe-10"
                    disabled={isPending}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute end-3 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 text-base font-bold shadow-teal-glow cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("resetting")}
                  </>
                ) : (
                  t("title")
                )}
              </Button>
            </form>
          )}

          {/* Back to login */}
          <div className="text-center pt-3 border-t border-dashed border-border/80">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              <BackIcon className="h-3.5 w-3.5" />
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
