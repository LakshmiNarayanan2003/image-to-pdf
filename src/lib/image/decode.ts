import type { ImageItem, Raster } from '../types';
import { abortCheck, UserError } from '../utils';
import { LIMITS } from '../validation/limits';
import { checkHeaderDimensions, detectFormat, MIME } from './detect';
import { jpegInfo, stripJpegMetadata } from './exif';
import { nativeRaster, thumbnail } from './native';
import { safeSvg } from './svg';
function localDecoder(
  bytes: ArrayBuffer,
  format: 'heic' | 'tiff' | 'gif',
  signal: AbortSignal,
  maxPages: number,
  budget: number,
): Promise<Raster[]> {
  return new Promise((resolve, reject) => {
    abortCheck(signal);
    const worker = new Worker(new URL('./decoder.worker.ts', import.meta.url), {
      type: 'module',
    });
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      worker.terminate();
    };
    const cancel = () => {
      cleanup();
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new UserError(
          'Decoding took too long. Try a smaller image or export a JPEG/PNG.',
        ),
      );
    }, 45000);
    signal.addEventListener('abort', cancel, { once: true });
    worker.onmessage = (
      event: MessageEvent<{ rasters?: Raster[]; error?: string }>,
    ) => {
      cleanup();
      if (event.data.rasters) resolve(event.data.rasters);
      else reject(new UserError(event.data.error || 'Local decoder failed.'));
    };
    worker.onerror = () => {
      cleanup();
      reject(
        new UserError(
          'The local image decoder could not start. Reconnect to load its bundled code, or use a JPEG/PNG.',
        ),
      );
    };
    worker.postMessage({ bytes, format, maxPages, budget }, [bytes]);
  });
}
export async function prepareImage(
  file: File,
  signal: AbortSignal,
  maxPages: number,
  budget: number,
): Promise<ImageItem[]> {
  const buffer = await file.arrayBuffer();
  abortCheck(signal);
  const bytes = new Uint8Array(buffer),
    format = detectFormat(bytes, file.name, file.type);
  checkHeaderDimensions(bytes, format);
  let rasters: Raster[], jpeg: Blob | undefined;
  if (format === 'svg') {
    if (file.size > LIMITS.svgBytes)
      throw new UserError('SVG exceeds the 2 MB vector safety limit.');
    const svg = safeSvg(new TextDecoder().decode(bytes));
    rasters = [await nativeRaster(svg.blob, signal)];
  } else if (format === 'tiff' || format === 'heic' || format === 'gif')
    rasters = await localDecoder(buffer, format, signal, maxPages, budget);
  else {
    rasters = [
      await nativeRaster(new Blob([bytes], { type: MIME[format] }), signal),
    ];
    if (format === 'jpeg' && jpegInfo(bytes).direct)
      jpeg = new Blob([stripJpegMetadata(bytes)], { type: 'image/jpeg' });
  }
  abortCheck(signal);
  if (rasters.reduce((sum, r) => sum + r.png.size, jpeg?.size ?? 0) > budget)
    throw new UserError(
      'Decoded images exceed the 128 MB session safety limit. Use fewer or smaller images.',
    );
  const items: ImageItem[] = [],
    sourceId = crypto.randomUUID();
  try {
    for (let i = 0; i < rasters.length; i++) {
      const raster = rasters[i],
        previewUrl = await thumbnail(raster.png, signal);
      items.push({
        ...raster,
        id: crypto.randomUUID(),
        sourceId,
        name: rasters.length > 1 ? `${file.name} · page ${i + 1}` : file.name,
        size: file.size,
        format,
        rotation: 0,
        jpeg,
        previewUrl,
        note:
          format === 'gif'
            ? 'First frame'
            : format === 'heic'
              ? 'Primary image · 8-bit RGB'
              : format === 'tiff'
                ? `TIFF page ${i + 1} of ${rasters.length}`
                : format === 'svg'
                  ? 'Static vector · rasterized'
                  : '',
      });
    }
    return items;
  } catch (error) {
    items.forEach(disposeImage);
    throw error;
  }
}
export function disposeImage(item: ImageItem) {
  URL.revokeObjectURL(item.previewUrl);
}
