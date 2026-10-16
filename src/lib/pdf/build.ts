import type { ImageItem, PdfOptions, PdfOutput, Progress } from '../types';
import { abortCheck, nextFrame, pdfFilename, UserError } from '../utils';
import { LIMITS } from '../validation/limits';
import { canvasBlob, releaseCanvas, withImage } from '../image/native';
import { pageLayout } from './layout';
export async function encodeImage(
  item: ImageItem,
  options: PdfOptions,
  signal: AbortSignal,
) {
  if (options.quality === 'maximum') return item.jpeg ?? item.png;
  return withImage(item.png, signal, async (image, width, height) => {
    const cap = options.quality === 'standard' ? 2400 : 4096,
      factor = Math.min(1, cap / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * factor));
    canvas.height = Math.max(1, Math.round(height * factor));
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx)
        throw new UserError(
          'Could not create the output canvas. Use fewer images.',
        );
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return await canvasBlob(
        canvas,
        'image/jpeg',
        options.quality === 'standard' ? 0.85 : 0.95,
      );
    } finally {
      releaseCanvas(canvas);
    }
  });
}
export async function buildPdf(
  items: ImageItem[],
  options: PdfOptions,
  signal: AbortSignal,
  progress: (value: Progress) => void,
): Promise<PdfOutput> {
  if (!items.length || items.length > LIMITS.files)
    throw new UserError('Choose between 1 and 50 pages.');
  abortCheck(signal);
  const {
    PDFDocument,
    rgb,
    degrees,
    pushGraphicsState,
    popGraphicsState,
    rectangle,
    clip,
    endPath,
  } = await import('pdf-lib');
  const pdf = await PDFDocument.create(),
    name = pdfFilename(options.filename);
  pdf.setTitle(name.slice(0, -4));
  pdf.setCreator('Pix2PDF');
  pdf.setProducer('Pix2PDF');
  let bytes = 0;
  for (let i = 0; i < items.length; i++) {
    abortCheck(signal);
    progress({
      completed: i,
      total: items.length,
      stage: `Adding ${i + 1} of ${items.length}`,
    });
    await nextFrame();
    const item = items[i],
      layout = pageLayout(item.width, item.height, item.rotation, options);
    const encoded = await encodeImage(item, options, signal);
    abortCheck(signal);
    bytes += encoded.size;
    if (bytes > LIMITS.outputBytes)
      throw new UserError(
        'Output exceeds the 128 MB safety limit. Choose Standard quality or fewer pages.',
      );
    const image =
      encoded.type === 'image/jpeg'
        ? await pdf.embedJpg(await encoded.arrayBuffer())
        : await pdf.embedPng(await encoded.arrayBuffer());
    const page = pdf.addPage([layout.pageWidth, layout.pageHeight]);
    const color = options.background === 'white' ? rgb(1, 1, 1) : rgb(0, 0, 0);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: layout.pageWidth,
      height: layout.pageHeight,
      color,
    });
    page.pushOperators(
      pushGraphicsState(),
      rectangle(
        layout.margin,
        layout.margin,
        layout.availableWidth,
        layout.availableHeight,
      ),
      clip(),
      endPath(),
    );
    const swapped = item.rotation % 180 !== 0;
    page.drawImage(image, {
      x: layout.x + ([180, 270].includes(item.rotation) ? layout.width : 0),
      y: layout.y + ([90, 180].includes(item.rotation) ? layout.height : 0),
      width: swapped ? layout.height : layout.width,
      height: swapped ? layout.width : layout.height,
      rotate: degrees(-item.rotation),
    });
    page.pushOperators(popGraphicsState());
    // Flush each image stream before moving on; retained encoded output is still bounded above.
    await pdf.flush();
  }
  abortCheck(signal);
  progress({
    completed: items.length,
    total: items.length,
    stage: 'Creating PDF',
  });
  await nextFrame();
  const data = await pdf.save();
  abortCheck(signal);
  if (data.length > LIMITS.outputBytes)
    throw new UserError(
      'PDF exceeds the 128 MB safety limit. Choose Standard quality or fewer pages.',
    );
  return {
    blob: new Blob([new Uint8Array(data)], { type: 'application/pdf' }),
    name,
    pages: items.length,
  };
}
