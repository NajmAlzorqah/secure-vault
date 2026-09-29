"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { requestPasswordReset } from "@/app/actions/password-reset";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import {
  type ForgotPasswordInput,
  getForgotPasswordSchema,
} from "@/lib/validations";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgot");
  const ta = useTranslations("auth");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const [serverMessage, setServerMessage] = useState<string | undefined>(
    undefined,
  );
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const schema = useMemo(() => getForgotPasswordSchema(tv), [tv]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  const onSubmit = (data: ForgotPasswordInput) => {
    setServerMessage(undefined);
    setResetToken(undefined);
    startTransition(async () => {
      const result = await requestPasswordReset(data.email);
      if (result) {
        setServerMessage(result.message);
        if (result.token) {
          setResetToken(result.token);
        }
      }
    });
  };

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

          {/* Success / Info message */}
          {serverMessage && (
            <div
              className="bg-primary/15 border border-primary/30 text-teal-dark dark:text-teal-light p-3.5 rounded-xl text-sm font-medium"
              role="alert"
            >
              {serverMessage}
            </div>
          )}

          {/* Reset token display (dev/testing only) */}
          {resetToken && (
            <div className="bg-gold/15 border border-gold/30 p-3.5 rounded-xl text-xs space-y-2">
              <p className="text-[#8F7000] dark:text-gold-light font-bold">
                {t("resetTokenLabel")}
              </p>
              <Link
                href={`/reset-password?token=${resetToken}`}
                className="text-primary underline break-all block hover:brightness-110 font-medium"
              >
                {t("clickToReset")}
              </Link>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
              >
                {ta("emailAddress")}
              </label>
              <div className="relative">
                <Mail className="absolute start-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="najm@gmail.com"
                  dir="ltr"
                  className="ps-10"
                  disabled={isPending}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-coral font-medium mt-1">
                  {errors.email.message}
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
                  {t("sending")}
                </>
              ) : (
                t("sendResetLink")
              )}
            </Button>
          </form>

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
