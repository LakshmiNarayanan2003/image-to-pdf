import { abortCheck, UserError } from '../utils';
import { checkDimensions } from '../validation/limits';
export function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = canvas.height = 0;
}
export function canvasBlob(
  canvas: HTMLCanvasElement,
  mime = 'image/png',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob && blob.type === mime
          ? resolve(blob)
          : reject(
              new UserError(
                'The browser could not encode this image. Try a smaller image.',
              ),
            ),
      mime,
      quality,
    ),
  );
}
export async function withImage<T>(
  blob: Blob,
  signal: AbortSignal,
  consume: (
    image: CanvasImageSource,
    width: number,
    height: number,
  ) => Promise<T>,
): Promise<T> {
  abortCheck(signal);
  let bitmap: ImageBitmap | undefined;
  // ImageBitmap freezes the default (first) frame and applies EXIF once.
  if (blob.type !== 'image/svg+xml') {
    try {
      bitmap = await createImageBitmap(blob, {
        imageOrientation: 'from-image',
      });
    } catch {
      /* Native HTML image is the compatibility fallback. */
    }
  }
  if (bitmap) {
    try {
      abortCheck(signal);
      checkDimensions(bitmap.width, bitmap.height);
      return await consume(bitmap, bitmap.width, bitmap.height);
    } finally {
      bitmap.close();
    }
  }
  const url = URL.createObjectURL(blob),
    img = new Image();
  const cancel = () => {
    img.src = '';
  };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    img.src = url;
    await img.decode();
    abortCheck(signal);
    checkDimensions(img.naturalWidth, img.naturalHeight);
    return await consume(img, img.naturalWidth, img.naturalHeight);
  } catch (error) {
    abortCheck(signal);
    if (error instanceof UserError) throw error;
    throw new UserError(
      'Your browser could not decode this image. It may be corrupt, or this browser may not support its codec (especially AVIF). Try a JPEG or PNG.',
    );
  } finally {
    signal.removeEventListener('abort', cancel);
    img.src = '';
    URL.revokeObjectURL(url);
  }
}
export async function nativeRaster(blob: Blob, signal: AbortSignal) {
  return withImage(blob, signal, async (image, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx)
        throw new UserError(
          'Canvas is unavailable. Close other tabs and try again.',
        );
      ctx.drawImage(image, 0, 0);
      const png = await canvasBlob(canvas);
      abortCheck(signal);
      return { width, height, png };
    } finally {
      releaseCanvas(canvas);
    }
  });
}
export async function thumbnail(blob: Blob, signal: AbortSignal) {
  return withImage(blob, signal, async (image, width, height) => {
    const scale = Math.min(1, 360 / Math.max(width, height)),
      canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new UserError('Preview canvas unavailable.');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const preview = await canvasBlob(canvas);
      abortCheck(signal);
      return URL.createObjectURL(preview);
    } finally {
      releaseCanvas(canvas);
    }
  });
}
