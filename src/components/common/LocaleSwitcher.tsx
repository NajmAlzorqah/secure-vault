"use client";

import { Check, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type Locale,
  localeCookieName,
  localeNames,
  locales,
} from "@/i18n/config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("localeSwitcher");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    // biome-ignore lint/suspicious/noDocumentCookie: standard locale-cookie mechanism recommended by next-intl
    document.cookie = `${localeCookieName}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("label")}
        title={t("label")}
        disabled={isPending}
        className="flex items-center gap-2 bg-transparent border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer hover:border-zinc-700 hover:bg-zinc-800 transition-all disabled:opacity-50"
      >
        <Languages className="h-3.5 w-3.5" />
        <span>{localeNames[locale as Locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 min-w-36 bg-zinc-900 border border-zinc-800 text-zinc-300 [&_*]:text-zinc-300 focus:bg-zinc-800 data-open:bg-zinc-900"
      >
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => switchTo(l)}
            className="cursor-pointer px-2 py-1.5 text-xs hover:bg-zinc-800 data-highlighted:bg-zinc-800"
          >
            <Check
              className={`h-3.5 w-3.5 ${l === locale ? "opacity-100" : "opacity-0"} ${l === locale ? "text-emerald-400" : ""}`}
            />
            <span dir={l === "ar" ? "rtl" : "ltr"}>{localeNames[l]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
