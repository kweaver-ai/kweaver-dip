import intl from "react-intl-universal";
import errorEnUS from "./locales/error/en-US.json";
import errorZhCN from "./locales/error/zh-CN.json";
import errorZhTW from "./locales/error/zh-TW.json";
import globalEnUS from "./locales/global/en-US.json";
import globalZhCN from "./locales/global/zh-CN.json";
import globalZhTW from "./locales/global/zh-TW.json";

export const SUPPORTED_LOCALES = ["zh-CN", "zh-TW", "en-US"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleMessages = Record<string, unknown>;
export type LocaleMessagesByLocale = Record<AppLocale, LocaleMessages>;
export type IntlLocaleMessages = Record<string, LocaleMessages>;

export const DEFAULT_LOCALE: AppLocale = "zh-CN";

const localeAliasMap: Record<string, AppLocale> = {
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  "zh-sg": "zh-CN",
  "zh-hans": "zh-CN",
  "zh-tw": "zh-TW",
  "zh-hk": "zh-TW",
  "zh-mo": "zh-TW",
  "zh-hant": "zh-TW",
  en: "en-US",
  "en-us": "en-US",
  "en-gb": "en-US"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeMessages(
  target: Record<string, unknown>,
  source: Record<string, unknown>
) {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    const current = result[key];
    if (isRecord(current) && isRecord(value)) {
      result[key] = deepMergeMessages(current, value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

export function normalizeLocale(
  locale: string | null | undefined,
  fallback: AppLocale = DEFAULT_LOCALE
): AppLocale {
  if (!locale) {
    return fallback;
  }

  const normalized = locale.trim().replace(/_/g, "-");
  if (!normalized) {
    return fallback;
  }

  const directMatch = SUPPORTED_LOCALES.find(
    (item) => item.toLowerCase() === normalized.toLowerCase()
  );
  if (directMatch) {
    return directMatch;
  }

  const aliasMatch = localeAliasMap[normalized.toLowerCase()];
  if (aliasMatch) {
    return aliasMatch;
  }

  const [language] = normalized.toLowerCase().split("-");
  return localeAliasMap[language] ?? fallback;
}

export function getNavigatorLocale(
  fallback: AppLocale = DEFAULT_LOCALE
): AppLocale {
  if (typeof navigator === "undefined") {
    return fallback;
  }

  const rawLocale = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage;
  return normalizeLocale(rawLocale, fallback);
}

export const getNavigatorLanguage = getNavigatorLocale;

export function mergeLocaleMessages(
  ...sources: Array<Partial<Record<AppLocale, LocaleMessages>>>
): LocaleMessagesByLocale {
  const base: LocaleMessagesByLocale = {
    "zh-CN": {},
    "zh-TW": {},
    "en-US": {}
  };

  for (const source of sources) {
    for (const locale of SUPPORTED_LOCALES) {
      const nextMessages = source[locale];
      if (!nextMessages) {
        continue;
      }

      base[locale] = deepMergeMessages(
        base[locale] as Record<string, unknown>,
        nextMessages as Record<string, unknown>
      );
    }
  }

  return base;
}

export function defineUiLocaleMap<T>(map: Record<AppLocale, T>) {
  return map;
}

export function getMappedUiLocale<T>(
  locale: string | null | undefined,
  map: Record<AppLocale, T>,
  fallback: AppLocale = DEFAULT_LOCALE
) {
  return map[normalizeLocale(locale, fallback)];
}

export interface InitI18nOptions {
  currentLocale?: string | null | undefined;
  locales?: IntlLocaleMessages;
  fallbackLocale?: AppLocale;
}

export async function initI18n(options: InitI18nOptions = {}) {
  const fallbackLocale = options.fallbackLocale ?? DEFAULT_LOCALE;
  const currentLocale = normalizeLocale(
    options.currentLocale ?? getNavigatorLocale(fallbackLocale),
    fallbackLocale
  );

  await intl.init({
    currentLocale,
    locales: options.locales ?? sharedLocaleMessages,
    fallbackLocale
  });

  return intl;
}

export async function changeI18nLanguage(
  locale: string | null | undefined,
  options: Omit<InitI18nOptions, "currentLocale"> = {}
) {
  return initI18n({
    ...options,
    currentLocale: locale
  });
}

export function t(
  key: string,
  variables?: Record<string, unknown>
) {
  return String(intl.get(key, variables));
}

export const sharedLocaleMessages = mergeLocaleMessages(
  {
    "zh-CN": errorZhCN,
    "zh-TW": errorZhTW,
    "en-US": errorEnUS
  },
  {
    "zh-CN": globalZhCN,
    "zh-TW": globalZhTW,
    "en-US": globalEnUS
  }
);

export { intl };
export default intl;
