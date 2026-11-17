import { getClientApiBaseUrl } from "@/lib/api/base-url";
import { clientApiMessage } from "@/lib/api/client-messages";
import { ApiError, networkError, parseApiError } from "@/lib/api/errors";
import { handleApiAuthError } from "@/lib/auth/handle-api-auth-error";
import { exceedsUploadLimit, shrinkImageForUpload } from "@/lib/image-shrink";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Abort the request after this many ms (default 15s). */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;
/** Multipart uploads (photos / PDFs up to 4 MB on slow phone connections). */
const FORM_DATA_TIMEOUT_MS = 60_000;

function apiUrl(path: string): string {
  const baseUrl = getClientApiBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Timeout signal, combined with the caller's signal when there is one. */
function requestSignal(
  timeoutMs: number,
  signal?: AbortSignal | null,
): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!signal) return timeout;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, timeout]);
  }
  return signal;
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

function timeoutError(): ApiError {
  return new ApiError("TIMEOUT", clientApiMessage("timeout"), 0);
}

function requestFailed(error: unknown): ApiError {
  return isTimeoutError(error) ? timeoutError() : networkError();
}

async function readResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let payload: unknown = null;
  if (isJson) {
    let text: string;
    try {
      text = await response.text();
    } catch (error) {
      // Body stream aborted (timeout) or dropped mid-way.
      throw requestFailed(error);
    }
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = null;
      }
    }
  }

  if (!response.ok) {
    const error = parseApiError(
      response.status,
      payload,
      response.status === 429
        ? clientApiMessage("tooManyRequests")
        : "Request failed",
    );
    void handleApiAuthError(error);
    throw error;
  }

  if (isJson && payload === null) {
    throw parseApiError(response.status, null, "Invalid JSON response");
  }

  return payload as T;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    body,
    headers,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...rest
  } = options;

  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      ...rest,
      credentials: "include",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: requestSignal(timeoutMs, signal),
    });
  } catch (error) {
    throw requestFailed(error);
  }

  return readResponse<T>(response);
}

/**
 * Downscale photos in the form (see image-shrink) and enforce the 4 MB
 * per-file limit — Vercel rejects bodies above ~4.5 MB before the backend
 * sees them.
 */
async function prepareUploadForm(form: FormData): Promise<FormData> {
  const prepared = new FormData();
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") {
      prepared.append(key, value);
      continue;
    }
    const file =
      value instanceof File
        ? await shrinkImageForUpload(value)
        : new File([value], "file");
    if (exceedsUploadLimit(file)) {
      throw new ApiError(
        "PAYLOAD_TOO_LARGE",
        clientApiMessage("fileTooLarge"),
        413,
      );
    }
    prepared.append(key, file, file.name);
  }
  return prepared;
}

export async function apiFetchFormData<T>(
  path: string,
  form: FormData,
  method: "POST" | "PUT" = "POST",
): Promise<T> {
  const body = await prepareUploadForm(form);

  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      method,
      credentials: "include",
      body,
      signal: AbortSignal.timeout(FORM_DATA_TIMEOUT_MS),
    });
  } catch (error) {
    throw requestFailed(error);
  }

  return readResponse<T>(response);
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
