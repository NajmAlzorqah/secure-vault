"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { type AuthState, login } from "@/app/actions/auth";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground px-4 overflow-hidden">
      {/* Radial Flip7 background gradient */}
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
              SecureVault
            </h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          {/* Error alert */}
          {serverState?.message && (
            <div
              className="bg-coral/15 border border-coral/30 text-coral-dark dark:text-coral-light p-3.5 rounded-xl text-sm font-medium"
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
                className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
              >
                {t("emailAddress")}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="najm@gmail.com"
                dir="ltr"
                disabled={isPending}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-coral font-medium mt-1">
                  {errors.email.message}
                </p>
              )}
              {serverState?.errors?.email && !errors.email && (
                <p className="text-xs text-coral font-medium mt-1">
                  {serverState.errors.email[0]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
              >
                {t("password")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pe-10"
                  disabled={isPending}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                <p className="text-xs text-coral font-medium mt-1">
                  {errors.password.message}
                </p>
              )}
              {serverState?.errors?.password && !errors.password && (
                <p className="text-xs text-coral font-medium mt-1">
                  {serverState.errors.password[0]}
                </p>
              )}
              <PasswordRules password={passwordValue} showAlways={true} />
            </div>

            {/* Forgot password link */}
            <div className="text-end">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 text-base font-bold shadow-teal-glow cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("authenticating")}
                </>
              ) : (
                t("signIn")
              )}
            </Button>
          </form>

          {/* Footer with playful dashed divider */}
          <div className="text-center text-[11px] text-muted-foreground space-y-1 pt-3 border-t border-dashed border-border/80">
            <p>{t("securedWith")}</p>
            <p>{t("loginMonitored")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
