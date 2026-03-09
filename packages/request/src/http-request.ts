import qs from "query-string";
import axiosInstance from "./internal/axios-instance";
import { getCommonHttpHeaders, getHttpConfig } from "./config";
import { handleError } from "./internal/error-handler";
import type {
  AbortablePromise,
  CacheableRequestOptions,
  HttpResponse,
  RequestMethod,
  RequestOptions
} from "./types";

function transformRequestData(data: unknown) {
  if (
    data instanceof FormData ||
    typeof data === "string" ||
    data instanceof Blob ||
    data instanceof ArrayBuffer ||
    ArrayBuffer.isView(data)
  ) {
    return data;
  }

  if (data == null) {
    return data;
  }

  try {
    return JSON.stringify(data);
  } catch {
    return data;
  }
}

function transformResponseData(data: unknown) {
  if (typeof data !== "string" || !data) {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

export function createHttpRequest<T = unknown>(
  method: RequestMethod,
  url: string,
  options?: RequestOptions
): AbortablePromise<T | HttpResponse<T>> {
  const { body, headers, timeout = 60000, params, returnFullResponse } =
    options ?? {};

  const controller = new AbortController();
  const httpConfig = getHttpConfig();
  const finalUrl = httpConfig.buildUrl?.(url) ?? url;

  const promise = new Promise<T | HttpResponse<T>>((resolve, reject) => {
    axiosInstance
      .request<T>({
        method: method.toLowerCase(),
        url: finalUrl,
        data: body,
        params,
        paramsSerializer: (input) => qs.stringify(input),
        headers: {
          ...getCommonHttpHeaders(),
          ...(body instanceof FormData
            ? {}
            : { "Content-Type": "application/json;charset=UTF-8" }),
          ...(headers ?? {})
        },
        timeout,
        signal: controller.signal,
        transformRequest: [transformRequestData],
        transformResponse: [transformResponseData],
        validateStatus: (status) => status < 400
      })
      .then((response) => {
        resolve(returnFullResponse ? response : response.data);
      })
      .catch((error) => {
        handleError({
          error:
            controller.signal.aborted && !error?.message
              ? new Error("CANCEL")
              : error,
          url,
          reject,
          isOffline:
            typeof navigator !== "undefined" ? !navigator.onLine : false
        });
      });
  }) as AbortablePromise<T | HttpResponse<T>>;

  promise.abort = () => controller.abort();
  return promise;
}

function createCacheableHttp() {
  const caches: Record<string, AbortablePromise<unknown>> = {};

  return function cacheableHttp<T = unknown>(
    method: RequestMethod,
    url: string,
    options?: CacheableRequestOptions
  ) {
    const { body, params, expires = -1 } = options ?? {};
    const queryStr = qs.stringify(params ?? {});
    const key = `${method}:${url}${queryStr ? `?${queryStr}` : ""}${JSON.stringify(
      body ?? {}
    )}`;

    if (!caches[key]) {
      caches[key] = createHttpRequest<T>(method, url, options);

      if (expires !== -1) {
        setTimeout(() => {
          delete caches[key];
        }, expires);
      }
    }

    return caches[key] as AbortablePromise<T>;
  };
}

export const cacheableHttp = createCacheableHttp();
