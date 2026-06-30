"use client";

import { Check, X } from "lucide-react";
import { useMemo } from "react";

export type RuleId = "length" | "letter" | "number" | "special" | "required";

interface PasswordRulesProps {
  password?: string;
  showAlways?: boolean;
  enabledRules?: RuleId[];
}

const defaultRules: RuleId[] = ["length", "letter", "number", "special"];

export function PasswordRules({
  password = "",
  showAlways = false,
  enabledRules = defaultRules,
}: PasswordRulesProps) {
  const rules = useMemo(() => {
    const allRules = [
      {
        id: "required",
        label: "Password is required",
        met: password.length >= 1,
      },
      {
        id: "length",
        label: "At least 8 characters",
        met: password.length >= 8,
      },
      {
        id: "letter",
        label: "At least one letter",
        met: /[a-zA-Z]/.test(password),
      },
      {
        id: "number",
        label: "At least one number",
        met: /[0-9]/.test(password),
      },
      {
        id: "special",
        label: "At least one special character",
        met: /[^a-zA-Z0-9]/.test(password),
      },
    ];

    return allRules.filter((rule) => enabledRules.includes(rule.id as RuleId));
  }, [password, enabledRules]);

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
