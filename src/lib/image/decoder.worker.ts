import { checkDimensions, LIMITS } from '../validation/limits';
import { UserError, friendlyError } from '../utils';
import type { Raster } from '../types';
interface Request {
  bytes: ArrayBuffer;
  format: 'heic' | 'tiff' | 'gif';
  maxPages: number;
  budget: number;
}
async function png(data: ImageData, orientation = 1): Promise<Raster> {
  checkDimensions(data.width, data.height);
  const source = new OffscreenCanvas(data.width, data.height),
    ctx = source.getContext('2d');
  if (!ctx) throw new Error('No canvas');
  ctx.putImageData(data, 0, 0);
  const swapped = orientation >= 5 && orientation <= 8;
  const canvas = new OffscreenCanvas(
    swapped ? data.height : data.width,
    swapped ? data.width : data.height,
  );
  const target = canvas.getContext('2d');
  if (!target) throw new Error('No canvas');
  const w = data.width,
    h = data.height;
  const transforms: Record<
    number,
    [number, number, number, number, number, number]
  > = {
    1: [1, 0, 0, 1, 0, 0],
    2: [-1, 0, 0, 1, w, 0],
    3: [-1, 0, 0, -1, w, h],
    4: [1, 0, 0, -1, 0, h],
    5: [0, 1, 1, 0, 0, 0],
    6: [0, 1, -1, 0, h, 0],
    7: [0, -1, -1, 0, h, w],
    8: [0, -1, 1, 0, 0, w],
  };
  target.setTransform(...(transforms[orientation] ?? transforms[1]));
  target.drawImage(source, 0, 0);
  try {
    return {
      width: canvas.width,
      height: canvas.height,
      png: await canvas.convertToBlob({ type: 'image/png' }),
    };
  } finally {
    source.width = source.height = canvas.width = canvas.height = 0;
  }
}
async function run({ bytes, format, maxPages, budget }: Request) {
  const results: Raster[] = [];
  let retained = 0;
  const add = (raster: Raster) => {
    retained += raster.png.size;
    if (retained > Math.min(budget, LIMITS.retainedBytes))
      throw new UserError(
        'Decoded images exceed the 128 MB session safety limit. Use fewer or smaller images.',
      );
    results.push(raster);
  };
  if (format === 'tiff') {
    const { preflightTiff, tiffPage } = await import('./tiff');
    const count = preflightTiff(bytes, maxPages);
    for (let i = 0; i < count; i++) {
      const page = tiffPage(bytes, i);
      add(await png(page.data, page.orientation));
    }
  } else if (format === 'heic') {
    const { default: createModule } =
      await import('libheif-js/libheif-wasm/libheif-bundle.mjs');
    const lib = await createModule({ print: () => {}, printErr: () => {} });
    const images = new lib.HeifDecoder().decode(new Uint8Array(bytes));
    try {
      const image = images.find((item) => item.is_primary()) ?? images[0];
      if (!image)
        throw new UserError(
          'This HEIC/HEIF codec is unsupported or the image is damaged. Export a JPEG or PNG.',
        );
      const width = image.get_width(),
        height = image.get_height();
      checkDimensions(width, height);
      const data = await new Promise<ImageData>((resolve, reject) =>
        image.display(new ImageData(width, height), (result) =>
          result
            ? resolve(result)
            : reject(
                new UserError(
                  'HEIC decoding failed. Try exporting a JPEG from your photo library.',
                ),
              ),
        ),
      );
      add(await png(data));
    } finally {
      images.forEach((image) => image.free());
    }
  } else {
    const { parseGIF, decompressFrame } = await import('gifuct-js');
    const parsed = parseGIF(bytes),
      frame = parsed.frames.find((entry) => 'image' in entry);
    if (!frame || !('image' in frame)) throw new Error('No GIF frame');
    checkDimensions(parsed.lsd.width, parsed.lsd.height);
    checkDimensions(
      frame.image.descriptor.width,
      frame.image.descriptor.height,
    );
    const decoded = decompressFrame(frame, parsed.gct, true),
      data = new ImageData(parsed.lsd.width, parsed.lsd.height);
    for (let y = 0; y < decoded.dims.height; y++)
      for (let x = 0; x < decoded.dims.width; x++) {
        const tx = x + decoded.dims.left,
          ty = y + decoded.dims.top;
        if (tx < data.width && ty < data.height)
          data.data.set(
            decoded.patch.subarray(
              (y * decoded.dims.width + x) * 4,
              (y * decoded.dims.width + x) * 4 + 4,
            ),
            (ty * data.width + tx) * 4,
          );
      }
    add(await png(data));
  }
  return results;
}
self.onmessage = (event: MessageEvent<Request>) => {
  void run(event.data).then(
    (rasters) => self.postMessage({ rasters }),
    (error: unknown) => self.postMessage({ error: friendlyError(error) }),
  );
};
