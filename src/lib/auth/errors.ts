export type LoginErrorKey = "invalid" | "forbidden" | "deactivated" | "rateLimited";

function errorRecord(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== "object") return null;
  return error as Record<string, unknown>;
}

export function isDeactivatedAuthError(error: unknown): boolean {
  const record = errorRecord(error);
  if (!record) return false;
  const code = record.code ?? record.errorCode;
  return code === "ACCOUNT_DEACTIVATED";
}

export function isRateLimitAuthError(error: unknown): boolean {
  const record = errorRecord(error);
  if (!record) return false;
  if (record.status === 429 || record.statusCode === 429) return true;
  const code = record.code ?? record.errorCode;
  return code === "TOO_MANY_REQUESTS";
}

export function loginErrorKeyFromAuthError(error: unknown): LoginErrorKey {
  if (isDeactivatedAuthError(error)) return "deactivated";
  if (isRateLimitAuthError(error)) return "rateLimited";
  return "invalid";
}
