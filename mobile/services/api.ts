import axios from "axios";
import { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authSession } from "@/services/auth-session";
import { runtimeConfig } from "@/services/runtime-config";
import { normalizeRequestError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { tokenStorage } from "@/utils/storage";

export const api = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const normalizedError = normalizeRequestError(error);
    const status = error.response?.status;
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      logger.error("API request failed", {
        baseURL: originalRequest?.baseURL ?? runtimeConfig.apiBaseUrl,
        url: originalRequest?.url,
        method: originalRequest?.method,
        status,
        code: error.code,
        message: normalizedError.message,
      });
      throw normalizedError;
    }

    if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/register")) {
      logger.error("API auth request failed", {
        url: originalRequest.url,
        status,
        message: normalizedError.message,
      });
      throw normalizedError;
    }

    if (originalRequest.url?.includes("/auth/refresh")) {
      await authSession.clearSession();
      logger.error("API refresh request failed", {
        url: originalRequest.url,
        status,
        message: normalizedError.message,
      });
      throw normalizedError;
    }

    originalRequest._retry = true;

    const nextAccessToken = await authSession.refreshSession();

    if (!nextAccessToken) {
      throw normalizedError;
    }

    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
    try {
      return await api(originalRequest);
    } catch (retryError) {
      const retryNormalizedError = normalizeRequestError(retryError);
      logger.error("API retry failed", {
        url: originalRequest.url,
        method: originalRequest.method,
        message: retryNormalizedError.message,
      });
      throw retryNormalizedError;
    }
  },
);
