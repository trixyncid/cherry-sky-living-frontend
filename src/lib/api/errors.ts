export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNPROCESSABLE"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR"
  | "NETWORK"
  | "TIMEOUT";

/** Backend AppError codes (excludes client-only NETWORK / TIMEOUT). */
const KNOWN_BACKEND_CODES = new Set<string>([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "UNPROCESSABLE",
  "TOO_MANY_REQUESTS",
  "INTERNAL_SERVER_ERROR",
]);

interface BackendErrorBody {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
  /** Better Auth errors put these at the top level. */
  code?: string;
  message?: string;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  /** Raw code from the response body (e.g. Better Auth's "ACCOUNT_DEACTIVATED"). */
  readonly serverCode?: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    status = 500,
    serverCode?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

function asApiErrorCode(value: string | undefined): ApiErrorCode | undefined {
  if (!value || !KNOWN_BACKEND_CODES.has(value)) return undefined;
  return value as ApiErrorCode;
}

export function parseApiError(
  status: number,
  body: unknown,
  fallbackMessage = "Request failed",
): ApiError {
  const parsed =
    body && typeof body === "object" ? (body as BackendErrorBody) : null;
  const rawCode =
    typeof parsed?.error?.code === "string"
      ? parsed.error.code
      : typeof parsed?.code === "string"
        ? parsed.code
        : undefined;
  const bodyMessage = parsed?.error?.message ?? parsed?.message;
  const message =
    typeof bodyMessage === "string" && bodyMessage
      ? bodyMessage
      : fallbackMessage;

  const statusToCode: Partial<Record<number, ApiErrorCode>> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    422: "UNPROCESSABLE",
    429: "TOO_MANY_REQUESTS",
  };

  const fromStatus = statusToCode[status];
  const fromBody = asApiErrorCode(rawCode);

  // Prefer HTTP status mapping when present; otherwise trust a known body code.
  const code = fromStatus ?? fromBody ?? "INTERNAL_SERVER_ERROR";

  return new ApiError(code, message, status, rawCode);
}

export function networkError(message = "Network request failed"): ApiError {
  return new ApiError("NETWORK", message, 0);
}

/** Client errors (400–499) won't succeed on retry; everything else may. */
export function isClientApiError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

export function isNotFoundApiError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 404 || error.code === "NOT_FOUND")
  );
}
