import type { Rotation } from './types';
export class UserError extends Error {}
export function friendlyError(error: unknown) {
  return error instanceof UserError
    ? error.message
    : 'This image could not be processed. It may be damaged or use unsupported features. Try another image or a smaller batch.';
}
export function abortCheck(signal: AbortSignal) {
  signal.throwIfAborted();
}
export function isCancelled(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}
export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.ceil(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
export function pdfFilename(value: string) {
  const stem = value
    .normalize('NFKC')
    .replace(/(?:\.pdf)+$/i, '')
    .replace(/[<>:"/\\|?*\p{Cc}\p{Cf}]/gu, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s-]+|[.\s-]+$/g, '')
    .slice(0, 100);
  return `${!stem ? 'images' : /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(stem) ? `images-${stem}` : stem}.pdf`;
}
export function rotate(current: Rotation, delta: number): Rotation {
  return ((current + delta + 360) % 360) as Rotation;
}
export function rotatedSize(width: number, height: number, rotation: Rotation) {
  return rotation % 180 ? { width: height, height: width } : { width, height };
}
export function reorder<T>(items: T[], from: number, to: number): T[] {
  if (
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length ||
    from === to
  )
    return items;
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}
export function nextFrame() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}
