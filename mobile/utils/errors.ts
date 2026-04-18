import { AxiosError } from "axios";

export type AppRequestErrorKind = "offline" | "timeout" | "auth" | "server" | "unknown";

export class AppRequestError extends Error {
  kind: AppRequestErrorKind;
  status?: number;

  constructor(message: string, kind: AppRequestErrorKind, status?: number) {
    super(message);
    this.name = "AppRequestError";
    this.kind = kind;
    this.status = status;
  }
}

export const normalizeRequestError = (error: unknown) => {
  if (error instanceof AppRequestError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status;

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return new AppRequestError("The request timed out. Try again.", "timeout");
      }

      return new AppRequestError("No internet connection. Check your network and try again.", "offline");
    }

    if (status === 401) {
      return new AppRequestError("Your session expired. Please sign in again.", "auth", status);
    }

    if (status && status >= 500) {
      return new AppRequestError("The server is unavailable right now. Try again shortly.", "server", status);
    }

    const responseData = error.response?.data;
    const responseMessage =
      typeof responseData === "object" && responseData && "message" in responseData
        ? String((responseData as { message?: unknown }).message ?? "")
        : "";

    return new AppRequestError(responseMessage || error.message || "Something went wrong. Try again.", "unknown", status);
  }

  if (error instanceof Error) {
    return new AppRequestError(error.message || "Something went wrong. Try again.", "unknown");
  }

  return new AppRequestError("Something went wrong. Try again.", "unknown");
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  const normalized = normalizeRequestError(error);
  return normalized.message || fallback;
};

export const isConnectionError = (error: unknown) => {
  const normalized = normalizeRequestError(error);
  return normalized.kind === "offline" || normalized.kind === "timeout" || normalized.kind === "server";
};
