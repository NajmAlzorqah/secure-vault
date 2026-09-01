"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { requestPasswordReset } from "@/app/actions/password-reset";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
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

          {/* Success / Info message */}
          {serverMessage && (
            <div
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm"
              role="alert"
            >
              {serverMessage}
            </div>
          )}

          {/* Reset token display (dev/testing only) */}
          {resetToken && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs space-y-2">
              <p className="text-amber-400 font-semibold">
                {t("resetTokenLabel")}
              </p>
              <Link
                href={`/reset-password?token=${resetToken}`}
                className="text-amber-300 underline break-all block hover:text-amber-200"
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
                className="text-xs font-medium text-zinc-400"
              >
                {ta("emailAddress")}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="najm@gmail.com"
                  dir="ltr"
                  className={`w-full bg-zinc-950 border rounded-lg ps-10 pe-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                      : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                  disabled={isPending}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.email.message}
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
                  {t("sending")}
                </>
              ) : (
                t("sendResetLink")
              )}
            </button>
          </form>

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
