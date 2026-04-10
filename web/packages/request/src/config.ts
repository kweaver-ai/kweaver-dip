import type { HttpConfig } from "./types";

const defaultConfig: HttpConfig = {
  accessToken: "",
  buildUrl: (url) => url,
  shouldSilenceError: (url) => /\/v1\/(ping|profile|avatars|user\/get)/.test(url),
  resolveErrorMessage: (status) => {
    if (status === 401) {
      return "认证已失效";
    }
    if (status === 408) {
      return "请求超时";
    }
    if (typeof status === "number" && status >= 500) {
      return "服务异常，请稍后再试";
    }
    return "请求失败";
  }
};

let httpConfig: HttpConfig = { ...defaultConfig };

export function normalizeLanguageTag(language: string | null | undefined) {
  if (!language) {
    return "";
  }

  const normalized = language.trim().replace(/_/g, "-");
  if (!normalized) {
    return "";
  }

  const [base, ...rest] = normalized.split("-");
  if (!base) {
    return "";
  }

  return [
    base.toLowerCase(),
    ...rest.map((part) => {
      if (part.length === 4) {
        return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
      }

      if (part.length <= 3) {
        return part.toUpperCase();
      }

      return part.toLowerCase();
    })
  ].join("-");
}

export function setHttpConfig(config: HttpConfig) {
  httpConfig = {
    ...httpConfig,
    ...config
  };
}

export function resetHttpConfig() {
  httpConfig = { ...defaultConfig };
}

export function getHttpConfig() {
  return httpConfig;
}

export function resolveAccessToken() {
  return httpConfig.getAccessToken?.() ?? httpConfig.accessToken ?? "";
}

export function resolveLanguage() {
  return normalizeLanguageTag(httpConfig.getLanguage?.() ?? "");
}

export function getCommonHttpHeaders() {
  const token = resolveAccessToken();
  const language = resolveLanguage();

  return {
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
    "X-Requested-With": "XMLHttpRequest",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
          Token: token
        }
      : {}),
    ...(language
      ? {
          "x-language": language,
          "Accept-Language": language
        }
      : {})
  };
}
