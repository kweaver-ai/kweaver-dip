import axios from "axios";
import { getHttpConfig } from "../config";
import type { HandleErrorParams } from "../types";

const errorMessageCache = new Map<string, number>();
const DEDUP_INTERVAL = 2000;

function emitErrorMessage(messageText: string) {
  const config = getHttpConfig();
  const now = Date.now();
  const lastShownTime = errorMessageCache.get(messageText);

  if (lastShownTime && now - lastShownTime < DEDUP_INTERVAL) {
    return;
  }

  errorMessageCache.set(messageText, now);
  config.onErrorMessage?.(messageText);
}

export function handleError({
  error,
  url,
  reject,
  isOffline
}: HandleErrorParams) {
  const config = getHttpConfig();
  const axiosError = axios.isAxiosError(error) ? error : undefined;

  const handleReject = (reason?: unknown) => {
    reject(reason);
  };

  if (config.shouldSilenceError?.(url)) {
    handleReject(0);
    return;
  }

  if (isOffline) {
    emitErrorMessage(config.resolveErrorMessage?.() ?? "网络异常");
    handleReject(0);
    return;
  }

  if (axiosError?.code === "ECONNABORTED") {
    emitErrorMessage(config.resolveErrorMessage?.(408) ?? "请求超时");
    handleReject(0);
    return;
  }

  if (
    axiosError?.code === "ERR_CANCELED" ||
    axiosError?.message === "CANCEL"
  ) {
    handleReject("CANCEL");
    return;
  }

  if (!axiosError?.response) {
    emitErrorMessage(config.resolveErrorMessage?.() ?? "服务异常，请稍后再试");
    handleReject(0);
    return;
  }

  const { status, data } = axiosError.response;

  if (status === 401 && config.onTokenExpired) {
    config.onTokenExpired((data as { code?: number } | undefined)?.code);
    handleReject(status);
    return;
  }

  if (status >= 500) {
    if (
      typeof data === "object" &&
      data !== null &&
      "description" in data &&
      (data as { description?: unknown }).description
    ) {
      handleReject(data);
      return;
    }

    emitErrorMessage(
      config.resolveErrorMessage?.(status) ?? "服务异常，请稍后再试"
    );
    handleReject(status);
    return;
  }

  handleReject(data);
}
