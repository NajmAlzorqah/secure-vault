"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  type SecuritySettingsState,
  updateSecuritySettings,
} from "@/app/actions/security-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SecuritySettingsData } from "@/lib/security-settings";
import { securitySettingsSchema } from "@/lib/validations";

interface SecuritySettingsClientProps {
  settings: SecuritySettingsData;
}

interface SettingsForm {
  minimumPasswordLength: number;
  passwordHistory: number;
  lockDuration: number;
  expirationDays: number;
  maxFailedAttempts: number;
  requireSpecialChar: boolean;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireLowercase: boolean;
}

export function SecuritySettingsClient({
  settings,
}: SecuritySettingsClientProps) {
  const [serverState, setServerState] = useState<
    SecuritySettingsState | undefined
  >(undefined);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit } = useForm<SettingsForm>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      minimumPasswordLength: settings.minimumPasswordLength,
      passwordHistory: settings.passwordHistory,
      lockDuration: settings.lockDuration,
      expirationDays: settings.expirationDays,
      maxFailedAttempts: settings.maxFailedAttempts,
      requireSpecialChar: settings.requireSpecialChar,
      requireUppercase: settings.requireUppercase,
      requireNumber: settings.requireNumber,
      requireLowercase: settings.requireLowercase,
    },
    mode: "onTouched",
  });

  const onSubmit = (data: SettingsForm) => {
    setServerState(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.append(
        "minimumPasswordLength",
        String(data.minimumPasswordLength),
      );
      formData.append("passwordHistory", String(data.passwordHistory));
      formData.append("lockDuration", String(data.lockDuration));
      formData.append("expirationDays", String(data.expirationDays));
      formData.append("maxFailedAttempts", String(data.maxFailedAttempts));
      if (data.requireSpecialChar) formData.append("requireSpecialChar", "on");
      if (data.requireUppercase) formData.append("requireUppercase", "on");
      if (data.requireNumber) formData.append("requireNumber", "on");
      if (data.requireLowercase) formData.append("requireLowercase", "on");

      const result = await updateSecuritySettings(undefined, formData);
      if (result) {
        setServerState(result);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Security Settings
        </h1>
        <p className="text-zinc-400">
          Configure password policies, lockout rules, and security requirements.
        </p>
      </div>

      {/* Status message */}
      {serverState?.message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            serverState.success
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {serverState.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Password Policy */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Password Policy
            </CardTitle>
            <CardDescription>
              Configure password complexity and history requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField
                label="Minimum Password Length"
                field="minimumPasswordLength"
                register={register}
                min={12}
                max={64}
              />
              <NumberField
                label="Password History (remember last N)"
                field="passwordHistory"
                register={register}
                min={0}
                max={24}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-400 font-medium">
                Character Requirements
              </p>
              <div className="grid grid-cols-2 gap-2">
                <CheckboxField
                  label="Require uppercase letters"
                  field="requireUppercase"
                  register={register}
                />
                <CheckboxField
                  label="Require lowercase letters"
                  field="requireLowercase"
                  register={register}
                />
                <CheckboxField
                  label="Require numbers"
                  field="requireNumber"
                  register={register}
                />
                <CheckboxField
                  label="Require special characters"
                  field="requireSpecialChar"
                  register={register}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lockout Policy */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              Lockout Policy
            </CardTitle>
            <CardDescription>
              Configure account lockout duration and failed attempt thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField
                label="Max Failed Attempts (before lock)"
                field="maxFailedAttempts"
                register={register}
                min={1}
                max={50}
              />
              <NumberField
                label="Lock Duration (minutes)"
                field="lockDuration"
                register={register}
                min={1}
                max={1440}
              />
            </div>
          </CardContent>
        </Card>

        {/* Expiration Policy */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              Expiration Policy
            </CardTitle>
            <CardDescription>
              Configure when users are forced to change their passwords.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NumberField
              label="Password Expiration (days, 0 = never)"
              field="expirationDays"
              register={register}
              min={0}
              max={3650}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function NumberField({
  label,
  field,
  register,
  min,
  max,
}: {
  label: string;
  field: string;
  register: ReturnType<typeof useForm<SettingsForm>>["register"];
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`field-${field}`}
        className="text-xs font-medium text-zinc-400"
      >
        {label}
      </label>
      <input
        id={`field-${field}`}
        type="number"
        min={min}
        max={max}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
        {...register(field as keyof SettingsForm, { valueAsNumber: true })}
      />
    </div>
  );
}

function CheckboxField({
  label,
  field,
  register,
}: {
  label: string;
  field: string;
  register: ReturnType<typeof useForm<SettingsForm>>["register"];
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
        {...register(field as keyof SettingsForm)}
      />
      <span className="text-xs text-zinc-300">{label}</span>
    </label>
  );
}
