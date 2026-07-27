"use client";

import { Check, X } from "lucide-react";
import { useMemo } from "react";

export type RuleId =
  | "length"
  | "letter"
  | "number"
  | "special"
  | "required"
  | "uppercase"
  | "lowercase";

interface PasswordRulesProps {
  password?: string;
  showAlways?: boolean;
  enabledRules?: RuleId[];
  settings?: {
    minimumPasswordLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecialChar: boolean;
  } | null;
}

export function PasswordRules({
  password = "",
  showAlways = false,
  enabledRules,
  settings,
}: PasswordRulesProps) {
  const rules = useMemo(() => {
    // If settings are provided, build rules dynamically
    if (settings) {
      const allRules = [
        {
          id: "length" as RuleId,
          label: `At least ${settings.minimumPasswordLength} characters`,
          test: (p: string) => p.length >= settings.minimumPasswordLength,
        },
      ];

      if (settings.requireUppercase) {
        allRules.push({
          id: "uppercase" as RuleId,
          label: "At least one uppercase letter",
          test: (p: string) => /[A-Z]/.test(p),
        });
      }
      if (settings.requireLowercase) {
        allRules.push({
          id: "lowercase" as RuleId,
          label: "At least one lowercase letter",
          test: (p: string) => /[a-z]/.test(p),
        });
      }
      if (settings.requireNumber) {
        allRules.push({
          id: "number" as RuleId,
          label: "At least one number",
          test: (p: string) => /[0-9]/.test(p),
        });
      }
      if (settings.requireSpecialChar) {
        allRules.push({
          id: "special" as RuleId,
          label: "At least one special character",
          test: (p: string) => /[^a-zA-Z0-9]/.test(p),
        });
      }

      return allRules.map((rule) => ({
        ...rule,
        met: rule.test(password),
      }));
    }

    // Fallback to static rules when no settings provided
    const defaultEnabled: RuleId[] = ["length", "letter", "number", "special"];
    const activeRules = enabledRules ?? defaultEnabled;

    const allRules = [
      {
        id: "required" as RuleId,
        label: "Password is required",
        met: password.length >= 1,
      },
      {
        id: "length" as RuleId,
        label: "At least 12 characters",
        met: password.length >= 12,
      },
      {
        id: "letter" as RuleId,
        label: "At least one letter",
        met: /[a-zA-Z]/.test(password),
      },
      {
        id: "number" as RuleId,
        label: "At least one number",
        met: /[0-9]/.test(password),
      },
      {
        id: "special" as RuleId,
        label: "At least one special character",
        met: /[^a-zA-Z0-9]/.test(password),
      },
    ];

    return allRules.filter((rule) => activeRules.includes(rule.id));
  }, [password, enabledRules, settings]);

  const hasStartedTyping = password.length > 0;

  if (rules.length === 0 || (!hasStartedTyping && !showAlways)) {
    return null;
  }

  // Calculate percentage met for a progress bar
  const metCount = rules.filter((r) => r.met).length;
  const percent = (metCount / rules.length) * 100;

  return (
    <div className="mt-2 p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-lg space-y-2.5 transition-all duration-300 animate-in fade-in slide-in-from-top-1">
      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-medium">
        <span>Password Requirements</span>
        <span>
          {metCount}/{rules.length} Met
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            metCount === rules.length
              ? "bg-emerald-500"
              : metCount >= Math.ceil(rules.length / 2)
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul
        className={`grid gap-x-4 gap-y-1.5 text-[11px] ${rules.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              !hasStartedTyping
                ? "text-zinc-500"
                : rule.met
                  ? "text-emerald-400"
                  : "text-red-400/90"
            }`}
          >
            {rule.met ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 stroke-[3px]" />
            ) : (
              <X
                className={`h-3.5 w-3.5 shrink-0 stroke-[3px] ${hasStartedTyping ? "text-red-400/90" : "text-zinc-500"}`}
              />
            )}
            <span className="truncate">{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
