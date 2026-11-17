import { describe, expect, test } from "bun:test";
import { ApiError, networkError } from "@/lib/api/errors";
import { shouldRetryQuery } from "@/lib/query/defaults";

describe("shouldRetryQuery", () => {
  test("never retries 4xx ApiErrors", () => {
    for (const status of [400, 401, 403, 404, 409, 413, 422, 429, 499]) {
      const error = new ApiError("BAD_REQUEST", "x", status);
      expect(shouldRetryQuery(0, error)).toBe(false);
    }
  });

  test("retries 5xx, network and timeout errors once", () => {
    const errors = [
      new ApiError("INTERNAL_SERVER_ERROR", "x", 500),
      new ApiError("INTERNAL_SERVER_ERROR", "x", 503),
      networkError(),
      new ApiError("TIMEOUT", "x", 0),
      new Error("boom"),
    ];
    for (const error of errors) {
      expect(shouldRetryQuery(0, error)).toBe(true);
      expect(shouldRetryQuery(1, error)).toBe(false);
    }
  });
});
