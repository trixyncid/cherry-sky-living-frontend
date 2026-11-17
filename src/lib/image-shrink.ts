/**
 * Browser-side image downscaling before upload.
 *
 * Vercel rejects request bodies above ~4.5 MB and phone photos are often
 * 5–12 MB, so photos are resized/re-encoded in the browser first. Anything
 * that cannot be shrunk (PDF, GIF, video, decode failure) is sent as is.
 */

/** Hard client limit per uploaded file, after shrinking (backend allows 5 MB). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Photos above this size are re-encoded even when their dimensions are fine. */
export const SHRINK_MIN_BYTES = 1.5 * 1024 * 1024;

/** Longest edge of an uploaded photo. */
export const MAX_IMAGE_EDGE = 2560;

const JPEG_QUALITY = 0.85;

const SHRINKABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Files already through shrinkImageForUpload (UI + API client both call it). */
const processed = new WeakSet<File>();

export function isShrinkableImageType(type: string): boolean {
  return SHRINKABLE_TYPES.has(type);
}

export function exceedsUploadLimit(file: { size: number }): boolean {
  return file.size > MAX_UPLOAD_BYTES;
}

/**
 * Target canvas size: scale down so the long edge is at most `maxEdge`,
 * keeping the aspect ratio. Never scales up.
 */
export function fitWithin(
  width: number,
  height: number,
  maxEdge = MAX_IMAGE_EDGE,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge || longEdge <= 0) return { width, height };
  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** True when a decoded image of this size/dimensions should be re-encoded. */
export function needsShrink(
  bytes: number,
  width: number,
  height: number,
): boolean {
  return bytes > SHRINK_MIN_BYTES || Math.max(width, height) > MAX_IMAGE_EDGE;
}

function jpegName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "") || "photo";
  return `${base}.jpg`;
}

function canvasToJpeg(
  width: number,
  height: number,
  draw: (
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  ) => void,
): Promise<Blob | null> {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);
    draw(ctx);
    return canvas
      .convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY })
      .catch(() => null);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  draw(ctx);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
}

/**
 * Downscale a JPEG/PNG/WebP photo to max 2560px on the long edge and
 * re-encode it as JPEG (quality 0.85). Returns the original file when it is
 * not a shrinkable image, already small, on any failure, or when the result
 * is not smaller.
 */
export async function shrinkImageForUpload(file: File): Promise<File> {
  if (processed.has(file)) return file;
  const result = await shrinkOnce(file);
  processed.add(file);
  processed.add(result);
  return result;
}

async function shrinkOnce(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof createImageBitmap !== "function")
    return file;
  if (!isShrinkableImageType(file.type)) return file;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    if (!needsShrink(file.size, bitmap.width, bitmap.height)) return file;

    const source = bitmap;
    const { width, height } = fitWithin(source.width, source.height);
    const blob = await canvasToJpeg(width, height, (ctx) => {
      // PNG/WebP transparency would turn black in JPEG.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(source, 0, 0, width, height);
    });
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], jpegName(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
