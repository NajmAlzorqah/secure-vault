"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createUser, type UserState, updateUser } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { PasswordRules } from "@/components/ui/PasswordRules";
import type { Role } from "@/generated/prisma/client";
import { createUserSchema, updateUserSchema } from "@/lib/validations";

interface UserFormProps {
  mode: "create" | "edit";
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserForm({ mode, user, onClose, onSuccess }: UserFormProps) {
  const action = mode === "create" ? createUser : updateUser;
  const [serverState, setServerState] = useState<UserState | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const schema = mode === "create" ? createUserSchema : updateUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      id: user?.id || "",
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "VIEWER",
      password: "",
      forcePasswordChange: false,
    },
    mode: "onTouched",
  });

  const nameValue = watch("name");
  const emailValue = watch("email");
  const roleValue = watch("role");
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
      formData.append("role", data.role);
      if (data.password) {
        formData.append("password", data.password);
      }
      if (mode === "edit" && data.forcePasswordChange) {
        formData.append("forcePasswordChange", "on");
      }

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
        className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">
            {mode === "create" ? "Add System User" : "Edit Admin User"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-900 transition-colors"
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
          className="p-6 space-y-4 overflow-y-auto"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="user-name"
              className="text-xs font-medium text-zinc-400"
            >
              Name *
            </label>
            <input
              id="user-name"
              type="text"
              placeholder="e.g. John Doe"
              className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
                errors.name
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                  : nameValue
                    ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                    : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
              disabled={isPending}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-email"
              className="text-xs font-medium text-zinc-400"
            >
              Email Address *
            </label>
            <input
              id="user-email"
              type="email"
              placeholder="e.g. user@vault.local"
              className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
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
                {errors.email.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-role"
              className="text-xs font-medium text-zinc-400"
            >
              System Role *
            </label>
            <select
              id="user-role"
              className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 transition-colors duration-200 ${
                errors.role
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                  : roleValue
                    ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                    : "border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
              disabled={isPending}
              {...register("role")}
            >
              <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
              <option value="EDITOR">Editor (Can Read/Write Secrets)</option>
              <option value="VIEWER">Viewer (Can Only View Secrets)</option>
            </select>
            {errors.role && (
              <p className="text-xs text-red-400 mt-1">
                {errors.role.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-password"
              className="text-xs font-medium text-zinc-400"
            >
              Password{" "}
              {mode === "create" ? "*" : "(leave blank to keep current)"}
            </label>
            <div className="relative">
              <input
                id="user-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-zinc-900 border rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200 ${
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
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
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
            <PasswordRules
              password={passwordValue}
              showAlways={mode === "create"}
            />
          </div>

          {/* Force Password Change (edit mode only) */}
          {mode === "edit" && (
            <div className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <input
                id="forcePasswordChange"
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                {...register("forcePasswordChange")}
              />
              <label
                htmlFor="forcePasswordChange"
                className="text-xs text-zinc-300 cursor-pointer select-none"
              >
                Force password change on next login
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="text-xs border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold"
              disabled={isPending}
            >
              {isPending
                ? "Saving..."
                : mode === "create"
                  ? "Add User"
                  : "Update User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
