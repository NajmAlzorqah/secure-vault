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

  const titleValue = watch("title");
  const usernameValue = watch("username");
  const passwordValue = watch("password");
  const urlValue = watch("url");
  const notesValue = watch("notes");
  const categoryValue = watch("category");

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
        setServerState(result);
        if (result.success) {
          onSuccess?.();
          onClose();
        } else if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            setError(field as any, { type: "server", message: messages[0] });
          });
        }
      }
    });
  };

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">
            {mode === "create" ? t("addTitle") : t("editTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-900 transition-colors"
            aria-label={tc("cancel")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {serverState?.message && !serverState.success && (
          <div className="mx-6 mt-4 p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/20 text-red-400">
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
                className="text-xs font-medium text-zinc-400"
              >
                {t("titleLabel")}
              </label>
              <input
                id="cred-title"
                type="text"
                placeholder={t("titlePlaceholder")}
                className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                  errors.title
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : titleValue
                      ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                disabled={isPending}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.title.message as string}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="cred-category"
                className="text-xs font-medium text-zinc-400"
              >
                {t("categoryLabel")}
              </label>
              <input
                id="cred-category"
                type="text"
                placeholder={t("categoryPlaceholder")}
                className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                  errors.category
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : categoryValue
                      ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                disabled={isPending}
                {...register("category")}
              />
              {errors.category && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.category.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cred-username"
              className="text-xs font-medium text-zinc-400"
            >
              {t("usernameLabel")}
            </label>
            <input
              id="cred-username"
              type="text"
              placeholder={t("usernamePlaceholder")}
              dir="ltr"
              className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                errors.username
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                  : usernameValue
                    ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                    : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
              disabled={isPending}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-red-400 mt-1">
                {errors.username.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cred-password"
              className="text-xs font-medium text-zinc-400"
            >
              {t("passwordLabel")}
            </label>
            <div className="relative">
              <input
                id="cred-password"
                type={showPassword ? "text" : "password"}
                placeholder={
                  mode === "edit"
                    ? t("passwordEditPlaceholder")
                    : t("passwordCreatePlaceholder")
                }
                className={`w-full bg-zinc-900 border rounded-lg ps-3 pe-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
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
              className="text-xs font-medium text-zinc-400"
            >
              {t("urlLabel")}
            </label>
            <input
              id="cred-url"
              type="text"
              placeholder={t("urlPlaceholder")}
              dir="ltr"
              className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                errors.url
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                  : urlValue
                    ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                    : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
              disabled={isPending}
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-red-400 mt-1">
                {errors.url.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cred-notes"
              className="text-xs font-medium text-zinc-400"
            >
              {t("notesLabel")}
            </label>
            <textarea
              id="cred-notes"
              rows={3}
              placeholder={t("notesPlaceholder")}
              className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 resize-y min-h-[80px] ${
                errors.notes
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                  : notesValue
                    ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                    : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
              disabled={isPending}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-red-400 mt-1">
                {errors.notes.message as string}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="text-xs border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white"
              disabled={isPending}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold"
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
