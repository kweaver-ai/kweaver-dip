import axios from "axios";
import { getHttpConfig, resolveAccessToken } from "../config";
import type { RefreshTokenResult } from "../types";

let isRefreshing = false;
let requests: Array<(token: string) => void> = [];

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const httpConfig = getHttpConfig();

    if (
      httpConfig.refreshToken &&
      error?.response &&
      error.response.status === 401
    ) {
      try {
        if (!isRefreshing) {
          isRefreshing = true;

          const tokenResult: RefreshTokenResult | undefined =
            await httpConfig.refreshToken();
          const newToken =
            tokenResult?.accessToken ?? resolveAccessToken();

          if (newToken) {
            for (const callback of requests) {
              callback(newToken);
            }
            requests = [];

            return axiosInstance.request({
              ...error.config,
              headers: {
                ...(error.config?.headers ?? {}),
                Authorization: `Bearer ${newToken}`,
                Token: newToken
              }
            });
          }

          throw error;
        }

        return new Promise((resolve) => {
          requests = [
            ...requests,
            (token) =>
              resolve(
                axiosInstance.request({
                  ...error.config,
                  headers: {
                    ...(error.config?.headers ?? {}),
                    Authorization: `Bearer ${token}`,
                    Token: token
                  }
                })
              )
          ];
        });
      } catch {
        isRefreshing = false;
        throw error;
      } finally {
        if (!requests.length) {
          isRefreshing = false;
        }
      }
    }

    throw error;
  }
);

export default axiosInstance;
