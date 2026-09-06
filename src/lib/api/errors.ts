export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR"
  | "NETWORK";

/** Backend AppError codes (excludes client-only NETWORK). */
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
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
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
  const parsed = body as BackendErrorBody | null;
  const message = parsed?.error?.message ?? fallbackMessage;

  const statusToCode: Partial<Record<number, ApiErrorCode>> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE",
    429: "TOO_MANY_REQUESTS",
  };

  const fromStatus = statusToCode[status];
  const fromBody = asApiErrorCode(parsed?.error?.code);

  // Prefer HTTP status mapping when present; otherwise trust a known body code.
  const code =
    fromStatus ?? fromBody ?? "INTERNAL_SERVER_ERROR";

  return new ApiError(code, message, status);
}

export function networkError(message = "Network request failed"): ApiError {
  return new ApiError("NETWORK", message, 0);
}

export function isNotFoundApiError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 404 || error.code === "NOT_FOUND")
  );
}
