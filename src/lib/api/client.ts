import { getClientApiBaseUrl } from "@/lib/api/base-url";
import { ApiError, networkError, parseApiError } from "@/lib/api/errors";
import { handleApiAuthError } from "@/lib/auth/handle-api-auth-error";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;

  const baseUrl = getClientApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...rest,
      credentials: "include",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw networkError();
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let payload: unknown = null;
  if (isJson) {
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = null;
      }
    }
  }

  if (!response.ok) {
    const error = parseApiError(response.status, payload);
    void handleApiAuthError(error);
    throw error;
  }

  if (isJson && payload === null) {
    throw parseApiError(response.status, null, "Invalid JSON response");
  }

  return payload as T;
}

export async function apiFetchFormData<T>(
  path: string,
  form: FormData,
  method: "POST" | "PUT" = "POST",
): Promise<T> {
  const baseUrl = getClientApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      body: form,
    });
  } catch {
    throw networkError();
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let payload: unknown = null;
  if (isJson) {
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = null;
      }
    }
  }

  if (!response.ok) {
    const error = parseApiError(response.status, payload);
    void handleApiAuthError(error);
    throw error;
  }

  if (isJson && payload === null) {
    throw parseApiError(response.status, null, "Invalid JSON response");
  }

  return payload as T;
}

export async function apiFetchOrThrow<T>(
  path: string,
  options?: ApiFetchOptions,
): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw networkError();
  }
}
