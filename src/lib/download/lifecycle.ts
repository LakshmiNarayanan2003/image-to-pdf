import type { ImageItem } from '../types';
export function inputBytes(items: ImageItem[]) {
  const seen = new Set<string>();
  return items.reduce((sum, item) => {
    if (seen.has(item.sourceId)) return sum;
    seen.add(item.sourceId);
    return sum + item.size;
  }, 0);
}
export function retainedBytes(items: ImageItem[]) {
  return items.reduce(
    (sum, item) => sum + item.png.size + (item.jpeg?.size ?? 0),
    0,
  );
}
