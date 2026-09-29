"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { forceChangePassword, type UserState } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordRules } from "@/components/ui/PasswordRules";
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
  const t = useTranslations("forceChange");
  const tv = useTranslations("validation");
  const [serverState, setServerState] = useState<UserState | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const schema = useMemo(
    () => getChangePasswordSchema(settings)(tv),
    [settings, tv],
  );

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

  const newPasswordValue = watch("newPassword");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md mx-4 bg-card border border-border/80 rounded-2xl shadow-card p-6 space-y-5 text-foreground">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-gold/15 border border-gold/30 rounded-2xl shadow-accent-glow/20">
            <ShieldAlert className="h-8 w-8 text-[#8F7000] dark:text-gold-light" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground font-heading">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        {/* Server message */}
        {serverState?.message && (
          <div
            className={`p-3.5 rounded-xl text-sm font-medium ${
              serverState.success
                ? "bg-primary/15 border border-primary/30 text-teal-dark dark:text-teal-light"
                : "bg-coral/15 border border-coral/30 text-coral-dark dark:text-coral-light"
            }`}
          >
            {serverState.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="fp-currentPassword"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("currentPassword")}
            </label>
            <div className="relative">
              <Input
                id="fp-currentPassword"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("currentPlaceholder")}
                className="pe-10"
                disabled={isPending}
                {...register("currentPassword")}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute end-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
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
              <p className="text-xs text-coral font-medium mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="fp-newPassword"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("newPassword")}
            </label>
            <div className="relative">
              <Input
                id="fp-newPassword"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("newPlaceholder")}
                className="pe-10"
                disabled={isPending}
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute end-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
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
              <p className="text-xs text-coral font-medium mt-1">
                {errors.newPassword.message}
              </p>
            )}
            <PasswordRules
              password={newPasswordValue}
              showAlways={true}
              settings={settings}
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="fp-confirmPassword"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <Input
                id="fp-confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("confirmPlaceholder")}
                className="pe-10"
                disabled={isPending}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute end-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
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
                {t("updating")}
              </>
            ) : (
              t("updatePassword")
            )}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground pt-2 border-t border-dashed border-border/80">
          {t("footer")}
        </p>
      </div>
    </div>
  );
}
