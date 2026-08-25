export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

/**
 * Locale used for Intl formatting with Western digits
 * (`ar` alone defaults to Eastern Arabic numerals).
 */
export const intlLocale: Record<Locale, string> = {
  ar: "ar-u-nu-latn",
  en: "en",
};

/**
 * Resolves an Intl locale tag for an arbitrary locale string,
 * falling back to the default locale's formatting rules.
 */
export function intlLocaleFor(locale: string): string {
  return isLocale(locale) ? intlLocale[locale] : intlLocale[defaultLocale];
}

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export const localeCookieName = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function dir(locale: string): "rtl" | "ltr" {
  return (isLocale(locale) ? locale : defaultLocale) === "ar" ? "rtl" : "ltr";
}
