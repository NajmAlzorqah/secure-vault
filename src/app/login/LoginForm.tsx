"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { type AuthState, login } from "@/app/actions/auth";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Logo } from "@/components/ui/logo";
import { PasswordRules } from "@/components/ui/PasswordRules";
import { getLoginSchema, type LoginInput } from "@/lib/validations";

export function LoginForm() {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const [serverState, setServerState] = useState<AuthState | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const schema = useMemo(() => getLoginSchema(tv), [tv]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

  const onSubmit = (data: LoginInput) => {
    setServerState(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await login(undefined, formData);
      if (result) {
        setServerState(result);
      }
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 overflow-hidden">
      {/* Radial background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />

      <div className="fixed top-4 end-4 z-50">
        <LocaleSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Logo className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              SecureVault
            </h1>
            <p className="text-sm text-zinc-400">{t("subtitle")}</p>
          </div>

          {/* Error alert */}
          {serverState?.message && (
            <div
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm"
              role="alert"
            >
              {serverState.message}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-zinc-400"
              >
                {t("emailAddress")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="najm@gmail.com"
                dir="ltr"
                className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                  errors.email
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : emailValue
                      ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                disabled={isPending}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.email.message}
                </p>
              )}
              {serverState?.errors?.email && !errors.email && (
                <p className="text-xs text-red-400 mt-1">
                  {serverState.errors.email[0]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-zinc-400"
              >
                {t("password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full bg-zinc-950 border rounded-lg ps-3 pe-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                      : passwordValue
                        ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                  disabled={isPending}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-2.5 text-zinc-400 hover:text-white"
                  aria-label={
                    showPassword ? t("hidePassword") : t("showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.password.message}
                </p>
              )}
              {serverState?.errors?.password && !errors.password && (
                <p className="text-xs text-red-400 mt-1">
                  {serverState.errors.password[0]}
                </p>
              )}
              <PasswordRules password={passwordValue} showAlways={true} />
            </div>

            {/* Forgot password link */}
            <div className="text-end">
              <Link
                href="/forgot-password"
                className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("authenticating")}
                </>
              ) : (
                t("signIn")
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-[10px] text-zinc-500 space-y-1 pt-2">
            <p>{t("securedWith")}</p>
            <p>{t("loginMonitored")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
