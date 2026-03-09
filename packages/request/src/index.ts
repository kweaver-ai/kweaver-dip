import { cacheableHttp, createHttpRequest } from "./http-request";
import { getCommonHttpHeaders, getHttpConfig, resetHttpConfig, setHttpConfig } from "./config";
import type { CacheableRequestOptions, RequestOptions } from "./types";

export const get = <T = unknown>(url: string, options?: RequestOptions) =>
  createHttpRequest<T>("GET", url, options);

export const post = <T = unknown>(url: string, options?: RequestOptions) =>
  createHttpRequest<T>("POST", url, options);

export const put = <T = unknown>(url: string, options?: RequestOptions) =>
  createHttpRequest<T>("PUT", url, options);

export const del = <T = unknown>(url: string, options?: RequestOptions) =>
  createHttpRequest<T>("DELETE", url, options);

export const patch = <T = unknown>(url: string, options?: RequestOptions) =>
  createHttpRequest<T>("PATCH", url, options);

export const cacheableGet = <T = unknown>(
  url: string,
  options?: CacheableRequestOptions
) => cacheableHttp<T>("GET", url, options);

export {
  cacheableHttp,
  createHttpRequest,
  getCommonHttpHeaders,
  getHttpConfig,
  resetHttpConfig,
  setHttpConfig
};

export type {
  AbortablePromise,
  CacheableRequestOptions,
  HandleErrorParams,
  HttpConfig,
  HttpResponse,
  RefreshTokenResult,
  RequestMethod,
  RequestOptions
} from "./types";

export { IncrementalActionEnum } from "./types";
