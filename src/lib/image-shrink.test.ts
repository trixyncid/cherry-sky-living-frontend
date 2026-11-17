import { describe, expect, test } from "bun:test";
import {
  exceedsUploadLimit,
  fitWithin,
  isShrinkableImageType,
  MAX_UPLOAD_BYTES,
  needsShrink,
  SHRINK_MIN_BYTES,
  shrinkImageForUpload,
} from "./image-shrink";

describe("fitWithin", () => {
  test("keeps images already within the max edge", () => {
    expect(fitWithin(2560, 1440)).toEqual({ width: 2560, height: 1440 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  test("scales the long edge down to 2560 keeping aspect ratio", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 2560, height: 1920 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1920, height: 2560 });
    expect(fitWithin(8000, 1000)).toEqual({ width: 2560, height: 320 });
  });

  test("never collapses a side to zero", () => {
    expect(fitWithin(100_000, 10)).toEqual({ width: 2560, height: 1 });
  });
});

describe("needsShrink", () => {
  test("shrinks large files or oversized dimensions only", () => {
    expect(needsShrink(SHRINK_MIN_BYTES, 2000, 1500)).toBe(false);
    expect(needsShrink(SHRINK_MIN_BYTES + 1, 2000, 1500)).toBe(true);
    expect(needsShrink(100_000, 2561, 100)).toBe(true);
    expect(needsShrink(100_000, 100, 2561)).toBe(true);
  });
});

describe("type and limit helpers", () => {
  test("only JPEG/PNG/WebP are shrinkable", () => {
    expect(isShrinkableImageType("image/jpeg")).toBe(true);
    expect(isShrinkableImageType("image/png")).toBe(true);
    expect(isShrinkableImageType("image/webp")).toBe(true);
    expect(isShrinkableImageType("image/gif")).toBe(false);
    expect(isShrinkableImageType("application/pdf")).toBe(false);
    expect(isShrinkableImageType("video/mp4")).toBe(false);
  });

  test("4 MB hard limit", () => {
    expect(exceedsUploadLimit({ size: MAX_UPLOAD_BYTES })).toBe(false);
    expect(exceedsUploadLimit({ size: MAX_UPLOAD_BYTES + 1 })).toBe(true);
  });

  test("returns the original file when it can't be shrunk", async () => {
    const pdf = new File(["%PDF-1.4"], "doc.pdf", { type: "application/pdf" });
    expect(await shrinkImageForUpload(pdf)).toBe(pdf);
  });
});
