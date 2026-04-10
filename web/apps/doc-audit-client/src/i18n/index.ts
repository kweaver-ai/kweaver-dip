import intl, { changeCurrentLocale } from 'react-intl-universal';

import zhCN from './locales/zh-cn.json';
import enUS from './locales/en-us.json';
import zhTW from './locales/zh-tw.json';

type LocaleData = Record<string, any>;

function normalizePlaceholders(input: any): any {
  if (typeof input === 'string') {
    return input.replace(/\{\{(\w+)\}\}/g, '{$1}');
  }
  if (Array.isArray(input)) return input.map(normalizePlaceholders);
  if (input && typeof input === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      out[k] = normalizePlaceholders(v);
    }
    return out;
  }
  return input;
}

const DEFAULT_LANG = 'zh-cn';

const locales: Record<string, LocaleData> = {
  'zh-cn': normalizePlaceholders(zhCN),
  'en-us': normalizePlaceholders(enUS),
  'zh-tw': normalizePlaceholders(zhTW),
  'vi-vn': normalizePlaceholders(enUS),
};

intl.init({
  currentLocale: DEFAULT_LANG,
  locales,
  fallbackLocale: 'zh-cn',
  escapeHtml: false,
});

export function changeLanguage(lang: string) {
  changeCurrentLocale(lang);
}

export function t(key: string, vars?: Record<string, unknown>) {
  return intl.get(key, vars);
}

export default intl;
