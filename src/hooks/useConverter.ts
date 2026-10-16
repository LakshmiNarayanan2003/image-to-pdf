import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_OPTIONS,
  type ImageItem,
  type PdfOptions,
  type PdfOutput,
  type Progress,
} from '../lib/types';
import { prepareImage, disposeImage } from '../lib/image/decode';
import { checkFile, LIMITS } from '../lib/validation/limits';
import {
  abortCheck,
  friendlyError,
  isCancelled,
  reorder,
  rotate,
  UserError,
} from '../lib/utils';
import { buildPdf } from '../lib/pdf/build';
import { inputBytes, retainedBytes } from '../lib/download/lifecycle';
export function useConverter() {
  const [images, setImages] = useState<ImageItem[]>([]),
    imagesRef = useRef<ImageItem[]>([]);
  const [options, setOptions] = useState<PdfOptions>(DEFAULT_OPTIONS);
  const [busy, setBusy] = useState(false),
    operation = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [errors, setErrors] = useState<string[]>([]),
    [notice, setNotice] = useState('');
  const [result, setResult] = useState<(PdfOutput & { url: string }) | null>(
      null,
    ),
    resultUrl = useRef('');
  const picker = useRef<HTMLInputElement>(null),
    download = useRef<HTMLAnchorElement>(null);
  const [dark, setDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(
    () => () => {
      operation.current?.abort();
      imagesRef.current.forEach(disposeImage);
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    },
    [],
  );
  useEffect(() => {
    if (result) download.current?.focus({ preventScroll: true });
  }, [result]);
  const saveImages = (next: ImageItem[]) => {
    imagesRef.current = next;
    setImages(next);
  };
  const clearResult = () => {
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = '';
    setResult(null);
  };
  const changeOptions = (next: PdfOptions) => {
    if (operation.current) return;
    setOptions(next);
    clearResult();
    setNotice('');
  };
  const clear = () => {
    if (operation.current) return;
    imagesRef.current.forEach(disposeImage);
    saveImages([]);
    clearResult();
    setErrors([]);
    setNotice('Images cleared from this session.');
    picker.current?.focus();
  };
  const remove = (id: string) => {
    if (operation.current) return;
    const image = imagesRef.current.find((item) => item.id === id);
    if (image) disposeImage(image);
    saveImages(imagesRef.current.filter((item) => item.id !== id));
    clearResult();
    setNotice('Image removed.');
  };
  const move = (id: string, target: number) => {
    if (operation.current) return;
    const from = imagesRef.current.findIndex((item) => item.id === id);
    const next = reorder(imagesRef.current, from, target);
    if (next === imagesRef.current) return;
    saveImages(next);
    clearResult();
    setNotice(`Moved ${next[target].name} to page ${target + 1}.`);
  };
  const turn = (id: string, delta: number) => {
    if (operation.current) return;
    saveImages(
      imagesRef.current.map((item) =>
        item.id === id
          ? { ...item, rotation: rotate(item.rotation, delta) }
          : item,
      ),
    );
    clearResult();
    setNotice('Rotation updated.');
  };
  const start = () => {
    if (operation.current) return null;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setErrors([]);
    setNotice('');
    clearResult();
    return controller;
  };
  const finish = () => {
    operation.current = null;
    setBusy(false);
    setProgress(null);
  };
  const ingest = async (source: File[] | 'samples') => {
    if (Array.isArray(source) && !source.length) return;
    const controller = start();
    if (!controller) return;
    const loaded: ImageItem[] = [],
      failures: string[] = [];
    try {
      let files: File[];
      if (source === 'samples') {
        files = [];
        setProgress({ stage: 'Loading sample images', completed: 0, total: 4 });
        for (const name of [
          'sample-photo.jpg',
          'sample-transparent.png',
          'sample-graphic.webp',
          'sample-vector.svg',
        ]) {
          const response = await fetch(
            `${import.meta.env.BASE_URL}samples/${name}`,
            { signal: controller.signal },
          );
          if (!response.ok)
            throw new UserError(
              'Sample images could not load. Reconnect and try again.',
            );
          const blob = await response.blob();
          files.push(new File([blob], name, { type: blob.type }));
        }
      } else files = source;
      for (let i = 0; i < files.length; i++) {
        abortCheck(controller.signal);
        if (imagesRef.current.length + loaded.length >= LIMITS.files) {
          failures.push(
            'Keep up to 50 pages at a time. Remove pages before adding more.',
          );
          break;
        }
        const file = files[i],
          current = [...imagesRef.current, ...loaded];
        setProgress({
          stage: `Preparing ${i + 1} of ${files.length}`,
          completed: i,
          total: files.length,
        });
        try {
          checkFile(file.size, current.length, inputBytes(current));
          loaded.push(
            ...(await prepareImage(
              file,
              controller.signal,
              LIMITS.files - current.length,
              LIMITS.retainedBytes - retainedBytes(current),
            )),
          );
        } catch (error) {
          abortCheck(controller.signal);
          failures.push(`${file.name.slice(0, 120)}: ${friendlyError(error)}`);
        }
      }
      abortCheck(controller.signal);
      saveImages([...imagesRef.current, ...loaded]);
      setNotice(
        loaded.length
          ? `${loaded.length} page${loaded.length === 1 ? '' : 's'} ready. Arrange your pages, then create your PDF.`
          : 'No new images added.',
      );
      setErrors(failures);
    } catch (error) {
      loaded.forEach(disposeImage);
      if (isCancelled(error))
        setNotice('Loading cancelled. Your previous images are still here.');
      else setErrors([friendlyError(error)]);
    } finally {
      finish();
    }
  };
  const convert = async () => {
    const controller = start();
    if (!controller) return;
    try {
      const output = await buildPdf(
        imagesRef.current,
        options,
        controller.signal,
        setProgress,
      );
      abortCheck(controller.signal);
      resultUrl.current = URL.createObjectURL(output.blob);
      setResult({ ...output, url: resultUrl.current });
      setNotice('Your PDF is ready.');
    } catch (error) {
      if (isCancelled(error))
        setNotice('Conversion cancelled. Your images are ready to try again.');
      else setErrors([friendlyError(error)]);
    } finally {
      finish();
    }
  };
  return {
    images,
    options,
    changeOptions,
    busy,
    progress,
    errors,
    setErrors,
    notice,
    result,
    picker,
    download,
    dark,
    setDark,
    clear,
    remove,
    move,
    turn,
    ingest,
    convert,
    cancel: () => operation.current?.abort(),
  };
}
