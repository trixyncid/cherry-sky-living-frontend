import { expect, test } from "bun:test";
import { formatIdrCompact } from "./format";

test("formatIdrCompact writes Indonesian short amounts with Rp", () => {
  expect(formatIdrCompact(4_200_000_000)).toBe("Rp 4,2 miliar");
  expect(formatIdrCompact(347_300_000)).toBe("Rp 347,3 juta");
  expect(formatIdrCompact(2_000_000)).toBe("Rp 2 juta");
  expect(formatIdrCompact(40_000)).toBe("Rp 40.000");
  expect(formatIdrCompact(0)).toBe("Rp 0");
});
