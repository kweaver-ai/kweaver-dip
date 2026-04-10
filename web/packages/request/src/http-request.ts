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

function sortSerializableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortSerializableValue);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right)
    );

    return Object.fromEntries(
      entries.map(([key, item]) => [key, sortSerializableValue(item)])
    );
  }

  return value;
}

function serializeCacheValue(value: unknown) {
  try {
    return JSON.stringify(sortSerializableValue(value));
  } catch {
    return String(value);
  }
}

export function transformRequestData(data: unknown) {
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

export function transformResponseData(data: unknown) {
  if (typeof data !== "string" || !data) {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

export function createRequestCacheKey(
  method: RequestMethod,
  url: string,
  options?: Pick<CacheableRequestOptions, "body" | "params">
) {
  const queryStr = qs.stringify(options?.params ?? {}, {
    sort: (left, right) => left.localeCompare(right)
  });

  return `${method}:${url}${queryStr ? `?${queryStr}` : ""}${serializeCacheValue(
    options?.body ?? {}
  )}`;
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
    const { expires = -1 } = options ?? {};
    const key = createRequestCacheKey(method, url, options);

    if (!caches[key]) {
      const request = createHttpRequest<T>(method, url, options);
      caches[key] = request;

      request.catch(() => {
        if (caches[key] === request) {
          delete caches[key];
        }
      });

      if (expires !== -1) {
        setTimeout(() => {
          if (caches[key] === request) {
            delete caches[key];
          }
        }, expires);
      }
    }

    return caches[key] as AbortablePromise<T>;
  };
}

export const cacheableHttp = createCacheableHttp();
