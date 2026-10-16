// Browser decoders apply EXIF orientation (including mirrored variants). Only
// orientation-1, three-channel JPEGs without ICC profiles may use direct PDF embedding.
export function jpegInfo(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let orientation = 1,
    channels = 0,
    icc = false;
  try {
    for (let i = 2; i + 4 < bytes.length;) {
      const marker = bytes[i + 1],
        length = view.getUint16(i + 2);
      if (marker === 0xda || marker === 0xd9 || length < 2) break;
      if (marker === 0xe2) icc = true;
      if ([0xc0, 0xc1, 0xc2].includes(marker)) channels = bytes[i + 9];
      if (
        marker === 0xe1 &&
        String.fromCharCode(...bytes.subarray(i + 4, i + 10)) === 'Exif\0\0'
      ) {
        const start = i + 10,
          little = view.getUint16(start) === 0x4949;
        const dir = start + view.getUint32(start + 4, little),
          count = view.getUint16(dir, little);
        for (let n = 0; n < Math.min(count, 4096); n++) {
          const pos = dir + 2 + n * 12;
          if (view.getUint16(pos, little) === 274)
            orientation = view.getUint16(pos + 8, little);
        }
      }
      i += length + 2;
    }
  } catch {
    orientation = 0;
  }
  return { orientation, direct: orientation === 1 && channels === 3 && !icc };
}
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 2;
  while (i + 4 < bytes.length) {
    const marker = bytes[i + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const end = i + 2 + view.getUint16(i + 2);
    if (end <= i + 2 || end > bytes.length)
      throw new Error('Invalid JPEG segment');
    if (!(marker >= 0xe1 && marker <= 0xef) && marker !== 0xfe)
      parts.push(bytes.subarray(i, end));
    i = end;
  }
  parts.push(bytes.subarray(i));
  const result = new Uint8Array(
    parts.reduce((sum, part) => sum + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
