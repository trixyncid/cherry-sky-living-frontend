import { describe, expect, test } from "bun:test";
import { ApiError, parseApiError } from "@/lib/api/errors";
import {
  isDeactivatedApiError,
  portalFromPathname,
} from "@/lib/auth/handle-api-auth-error";

describe("isDeactivatedApiError", () => {
  test("Better Auth ACCOUNT_DEACTIVATED code", () => {
    const error = parseApiError(403, {
      code: "ACCOUNT_DEACTIVATED",
      message: "This account has been deactivated. Contact your administrator.",
    });
    expect(isDeactivatedApiError(error)).toBe(true);
  });

  test("middleware AppError FORBIDDEN + Account deactivated", () => {
    const error = parseApiError(403, {
      success: false,
      error: { code: "FORBIDDEN", message: "Account deactivated" },
    });
    expect(isDeactivatedApiError(error)).toBe(true);
  });

  test("other 403s are not deactivation", () => {
    expect(
      isDeactivatedApiError(
        parseApiError(403, {
          error: {
            code: "FORBIDDEN",
            message: "Cannot create a lease for a deactivated tenant account",
          },
        }),
      ),
    ).toBe(false);
    expect(
      isDeactivatedApiError(
        new ApiError("NOT_FOUND", "Account deactivated", 404),
      ),
    ).toBe(false);
  });
});

describe("portalFromPathname", () => {
  test("matches the segment after the locale", () => {
    expect(portalFromPathname("/id/admin/leases")).toBe("admin");
    expect(portalFromPathname("/en/tenant")).toBe("tenant");
    expect(portalFromPathname("/admin/login")).toBe("admin");
  });

  test("ignores admin/tenant elsewhere in the path", () => {
    expect(portalFromPathname("/id/kosts/admin-suite")).toBe(null);
    expect(portalFromPathname("/id/search-kosts")).toBe(null);
    expect(portalFromPathname("/id/kosts/x/tenant")).toBe(null);
  });
});
