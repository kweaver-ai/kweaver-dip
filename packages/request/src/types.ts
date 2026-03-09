import type { AxiosRequestConfig, AxiosResponse } from "axios";

export interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, unknown>;
  returnFullResponse?: boolean;
}

export interface CacheableRequestOptions extends RequestOptions {
  expires?: number;
}

export interface RefreshTokenResult {
  accessToken: string;
}

export interface HttpConfig {
  accessToken?: string;
  getAccessToken?: () => string;
  getLanguage?: () => string;
  refreshToken?: () => Promise<RefreshTokenResult | undefined>;
  onTokenExpired?: (code?: number) => void;
  buildUrl?: (url: string) => string;
  onErrorMessage?: (message: string) => void;
  resolveErrorMessage?: (status?: number) => string;
  shouldSilenceError?: (url: string) => boolean;
}

export interface HandleErrorParams {
  error: unknown;
  url: string;
  reject: (reason?: unknown) => void;
  isOffline?: boolean;
}

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpResponse<T> = AxiosResponse<T>;

export interface AbortablePromise<T> extends Promise<T> {
  abort: () => void;
}

export type InternalAxiosConfig = AxiosRequestConfig;

export enum IncrementalActionEnum {
  Upsert = "upsert",
  Append = "append",
  Remove = "remove",
  End = "end"
}
