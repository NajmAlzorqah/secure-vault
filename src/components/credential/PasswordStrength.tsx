"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import zxcvbn from "zxcvbn";

interface PasswordStrengthProps {
  password: string;
}

const strengthLabelKeys = [
  "veryWeak",
  "weak",
  "fair",
  "strong",
  "veryStrong",
] as const;

const strengthColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-400",
  "bg-emerald-500",
];

/**
 * Maps English zxcvbn feedback strings (third-party library emits English only)
 * to message keys in the strength.warnings / strength.suggestions namespaces.
 * Unknown strings gracefully fall back to the original English.
 */
const warningKeyByEnglish: Record<string, string> = {
  "Straight rows of keys are easy to guess": "straightRows",
  "Short keyboard patterns are easy to guess": "shortPatterns",
  "Use a longer keyboard pattern with more turns": "longPatterns",
  "Repeats like 'aaa' are easy to guess": "repeatsAaa",
  "Repeats like 'abcabcabc' are only slightly harder to guess than 'abc'":
    "repeatsAbc",
  "Sequences like abc or 6543 are easy to guess": "sequences",
  "Recent years are easy to guess": "recentYears",
  "Dates are often easy to guess": "dates",
  "This is a top-10 common password": "top10",
  "This is a top-100 common password": "top100",
  "This is a very common password": "veryCommon",
  "This is similar to a commonly used password": "similarCommon",
  "A word by itself is easy to guess": "wordAlone",
  "Names and surnames by themselves are easy to guess": "namesAlone",
  "Common names and surnames are easy to guess": "commonNames",
  "Capitalization doesn't help very much": "capitalization",
  "All-uppercase is almost as easy to guess as all-lowercase": "allUppercase",
  "Reversed words aren't much harder to guess": "reversedWords",
  "Predictable substitutions like '@' instead of 'a' don't help very much":
    "substitutions",
};

const suggestionKeyByEnglish: Record<string, string> = {
  "Add another word or two. Uncommon words are better.": "addAnotherWord",
  "Use a longer keyboard pattern with more turns": "longerPattern",
  "Avoid repeated words and characters": "avoidRepeated",
  "Avoid sequences": "avoidSequences",
  "Avoid years": "avoidYears",
  "Avoid dates": "avoidDates",
  "Avoid recent years": "avoidRecentYears",
  "Avoid years that are associated with you": "avoidAssociatedYears",
  "Avoid dates and years that are associated with you": "avoidAssociatedYears",
  "Capitalization doesn't help very much": "capitalization",
  "All-uppercase is almost as easy to guess as all-lowercase": "allUppercase",
  "Reversed words aren't much harder to guess": "reversedWords",
  "Predictable substitutions like '@' instead of 'a' don't help very much":
    "substitutions",
  "No need for symbols, digits, or uppercase letters": "noSymbolsNeeded",
};

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MONTH = DAY * 31;
const YEAR = DAY * 365;
const CENTURY = YEAR * 100;

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const t = useTranslations("strength");
  const tw = useTranslations("strength.warnings");
  const ts = useTranslations("strength.suggestions");

  const result = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password);
  }, [password]);

  if (!result || !password) return null;

  const { score } = result;

  // Rebuild the crack-time display locally so it can be localized
  const rawSeconds =
    result.crack_times_seconds.offline_slow_hashing_1e4_per_second;
  const seconds = Number(rawSeconds);
  let timeText: string;
  if (seconds < 2) {
    timeText = t("instant");
  } else if (seconds < MINUTE) {
    timeText = t("durationSeconds", { count: Math.round(seconds) });
  } else if (seconds < HOUR) {
    timeText = t("durationMinutes", { count: Math.round(seconds / MINUTE) });
  } else if (seconds < DAY) {
    timeText = t("durationHours", { count: Math.round(seconds / HOUR) });
  } else if (seconds < MONTH) {
    timeText = t("durationDays", { count: Math.round(seconds / DAY) });
  } else if (seconds < YEAR) {
    timeText = t("durationMonths", { count: Math.round(seconds / MONTH) });
  } else if (seconds < CENTURY) {
    timeText = t("durationYears", { count: Math.round(seconds / YEAR) });
  } else {
    timeText = t("durationCenturies", {
      count: Math.max(2, Math.round(seconds / CENTURY)),
    });
  }

  const warningEnglish = result.feedback.warning;
  const warningKey = warningKeyByEnglish[warningEnglish];
  const suggestionEnglish = result.feedback.suggestions[0];
  const suggestionKey = suggestionKeyByEnglish[suggestionEnglish];

  return (
    <div className="flex flex-col gap-1.5 mt-1 bg-zinc-950/20 p-2.5 border border-zinc-900 rounded-lg">
      {/* Strength bar */}
      <div className="flex gap-1 h-1.5" dir="ltr">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-colors duration-300 ${
              i <= score - 1 ? strengthColors[score] : "bg-zinc-800"
            }`}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between items-center text-[10px]">
        <span
          className={`font-semibold ${
            score <= 1
              ? "text-red-400"
              : score === 2
                ? "text-amber-400"
                : "text-emerald-400"
          }`}
        >
          {t(strengthLabelKeys[score])}
        </span>
        <span className="text-zinc-500">
          {t("crackTime", { time: timeText })}
        </span>
      </div>

      {/* Feedback */}
      {warningEnglish && (
        <p className="text-[10px] text-amber-500 leading-tight">
          ⚠ {warningKey ? tw(warningKey) : warningEnglish}
        </p>
      )}
      {suggestionEnglish && (
        <p className="text-[10px] text-zinc-400 leading-tight">
          💡 {suggestionKey ? ts(suggestionKey) : suggestionEnglish}
        </p>
      )}
    </div>
  );
}
