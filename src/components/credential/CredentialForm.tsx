"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  type CredentialState,
  createCredential,
  updateCredential,
} from "@/app/actions/credentials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordRules } from "@/components/ui/PasswordRules";
import {
  type CreateCredentialInput,
  getCreateCredentialSchema,
  getUpdateCredentialSchema,
} from "@/lib/validations";
import { PasswordGenerator } from "./PasswordGenerator";
import { PasswordStrength } from "./PasswordStrength";

interface CredentialFormProps {
  mode: "create" | "edit";
  credential?: {
    id: string;
    title: string;
    username: string;
    url: string | null;
    notes: string | null;
    category: string | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function CredentialForm({
  mode,
  credential,
  onClose,
  onSuccess,
}: CredentialFormProps) {
  const t = useTranslations("credentialForm");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const action = mode === "create" ? createCredential : updateCredential;
  const [serverState, setServerState] = useState<CredentialState | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const schema = useMemo(
    () =>
      mode === "create"
        ? getCreateCredentialSchema(tv)
        : getUpdateCredentialSchema(tv),
    [mode, tv],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError,
  } = useForm<CreateCredentialInput>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      title: credential?.title || "",
      username: credential?.username || "",
      password: "",
      url: credential?.url || "",
      notes: credential?.notes || "",
      category: credential?.category || "",
    },
    mode: "onTouched",
  });

  const passwordValue = watch("password");

  const onSubmit = (data: any) => {
    setServerState(undefined);
    startTransition(async () => {
      const formData = new FormData();
      if (mode === "edit" && credential?.id) {
        formData.append("id", credential.id);
      }
      formData.append("title", data.title);
      formData.append("username", data.username);
      if (data.password) {
        formData.append("password", data.password);
      }
      if (data.url) formData.append("url", data.url);
      if (data.notes) formData.append("notes", data.notes);
      if (data.category) formData.append("category", data.category);

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
        className="bg-card border border-border/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-card overflow-hidden"
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
            aria-label={tc("cancel")}
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
          className="overflow-y-auto p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="cred-title"
                className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
              >
                {t("titleLabel")}
              </label>
              <Input
                id="cred-title"
                type="text"
                placeholder={t("titlePlaceholder")}
                disabled={isPending}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-coral font-medium mt-1">
                  {errors.title.message as string}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="cred-category"
                className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
              >
                {t("categoryLabel")}
              </label>
              <Input
                id="cred-category"
                type="text"
                placeholder={t("categoryPlaceholder")}
                disabled={isPending}
                {...register("category")}
              />
              {errors.category && (
                <p className="text-xs text-coral font-medium mt-1">
                  {errors.category.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cred-username"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("usernameLabel")}
            </label>
            <Input
              id="cred-username"
              type="text"
              placeholder={t("usernamePlaceholder")}
              dir="ltr"
              disabled={isPending}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-coral font-medium mt-1">
                {errors.username.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cred-password"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("passwordLabel")}
            </label>
            <div className="relative">
              <Input
                id="cred-password"
                type={showPassword ? "text" : "password"}
                placeholder={
                  mode === "edit"
                    ? t("passwordEditPlaceholder")
                    : t("passwordCreatePlaceholder")
                }
                className="pe-10"
                disabled={isPending}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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

            <PasswordStrength password={passwordValue} />
            <PasswordRules
              password={passwordValue}
              showAlways={mode === "create"}
            />
          </div>

          {/* Password Generator */}
          <PasswordGenerator
            onGenerate={(pw) =>
              setValue("password", pw, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <div className="space-y-1.5">
            <label
              htmlFor="cred-url"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("urlLabel")}
            </label>
            <Input
              id="cred-url"
              type="text"
              placeholder={t("urlPlaceholder")}
              dir="ltr"
              disabled={isPending}
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-coral font-medium mt-1">
                {errors.url.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cred-notes"
              className="text-xs font-bold text-muted-foreground tracking-wide uppercase"
            >
              {t("notesLabel")}
            </label>
            <textarea
              id="cred-notes"
              rows={3}
              placeholder={t("notesPlaceholder")}
              className="w-full bg-input border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary transition-all duration-150 shadow-xs resize-y min-h-[80px]"
              disabled={isPending}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-coral font-medium mt-1">
                {errors.notes.message as string}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dashed border-border/80">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              size="sm"
              className="cursor-pointer font-semibold"
              disabled={isPending}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="cursor-pointer font-bold shadow-teal-glow"
              disabled={isPending}
            >
              {isPending
                ? tc("saving")
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
