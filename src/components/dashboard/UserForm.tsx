"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  createUser,
  updateUser,
  type UserState,
} from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordRules } from "@/components/ui/PasswordRules";
import type { Role } from "@/generated/prisma/client";
import type { SecuritySettingsData } from "@/lib/security-settings";
import {
  getCreateUserSchema,
  getUpdateUserSchema,
} from "@/lib/validations";

interface UserFormProps {
  mode: "create" | "edit";
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  settings: SecuritySettingsData;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserForm({
  mode,
  user,
  settings,
  onClose,
  onSuccess,
}: UserFormProps) {
  const t = useTranslations("userForm");
  const tr = useTranslations("roles");
  const tv = useTranslations("validation");
  const action = mode === "create" ? createUser : updateUser;
  const [serverState, setServerState] = useState<UserState | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const schema = useMemo(
    () =>
      mode === "create"
        ? getCreateUserSchema(settings)(tv)
        : getUpdateUserSchema(settings)(tv),
    [mode, settings, tv],
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      id: user?.id || "",
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "VIEWER",
      forcePasswordChange: false,
    },
    mode: "onTouched",
  });

  const passwordValue = watch("password");

  const onSubmit = (data: any) => {
    setServerState(undefined);
    startTransition(async () => {
      const formData = new FormData();
      if (mode === "edit" && user?.id) {
        formData.append("id", user.id);
      }
      formData.append("name", data.name);
      formData.append("email", data.email);
      if (data.password) {
        formData.append("password", data.password);
      }
      formData.append("role", data.role);
      if (data.forcePasswordChange) {
        formData.append("forcePasswordChange", "true");
      }

      const result = await action(undefined, formData);
      if (result) {
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setError(field as any, {
                type: "server",
                message: messages[0],
              });
            }
          });
        }
        setServerState(result);
        if (result.success) {
          onSuccess?.();
          onClose();
        }
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 duration-150"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border/80 rounded-2xl w-full max-w-md shadow-card flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h3 className="text-lg font-extrabold text-foreground font-heading">
            {mode === "create" ? t("addTitle") : t("editTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-secondary transition-colors cursor-pointer"
            aria-label={t("cancel")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {serverState?.message && !serverState.success && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl text-sm font-medium bg-coral/15 border border-coral/30 text-coral-dark dark:text-coral-light">
            {serverState.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-4 overflow-y-auto"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="user-name"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("nameLabel")}
            </label>
            <Input
              id="user-name"
              type="text"
              placeholder={t("namePlaceholder")}
              disabled={isPending}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-coral font-medium mt-1">
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-email"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("emailLabel")}
            </label>
            <Input
              id="user-email"
              type="email"
              placeholder={t("emailPlaceholder")}
              dir="ltr"
              disabled={isPending}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-coral font-medium mt-1">
                {errors.email.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-role"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("roleLabel")}
            </label>
            <select
              id="user-role"
              className="w-full bg-input border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary transition-all duration-150 shadow-xs cursor-pointer"
              disabled={isPending}
              {...register("role")}
            >
              <option value="SUPER_ADMIN">{tr("SUPER_ADMIN")}</option>
              <option value="EDITOR">{tr("EDITOR")}</option>
              <option value="VIEWER">{tr("VIEWER")}</option>
            </select>
            {errors.role && (
              <p className="text-xs text-coral font-medium mt-1">
                {errors.role.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-password"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("passwordLabel")}{" "}
              {mode === "create"
                ? t("passwordRequiredHint")
                : t("passwordOptionalHint")}
            </label>
            <div className="relative">
              <Input
                id="user-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pe-10"
                disabled={isPending}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
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
                {errors.password.message as string}
              </p>
            )}
            <PasswordRules
              password={passwordValue}
              showAlways={mode === "create"}
            />
          </div>

          {/* Force Password Change (edit mode only) */}
          {mode === "edit" && (
            <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border/80 rounded-xl">
              <input
                id="forcePasswordChange"
                type="checkbox"
                className="h-4 w-4 rounded-md border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                {...register("forcePasswordChange")}
              />
              <label
                htmlFor="forcePasswordChange"
                className="text-xs text-foreground font-semibold cursor-pointer select-none"
              >
                {t("forceChangeLabel")}
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dashed border-border/80">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              size="sm"
              className="font-semibold cursor-pointer"
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="font-bold shadow-teal-glow cursor-pointer"
              disabled={isPending}
            >
              {isPending
                ? t("saving")
                : mode === "create"
                  ? t("addButton")
                  : t("updateButton")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
