export type ImageFormat =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'gif'
  | 'bmp'
  | 'svg'
  | 'avif'
  | 'heic'
  | 'tiff'
  | 'ico';
export type Rotation = 0 | 90 | 180 | 270;
export interface ImageItem {
  id: string;
  sourceId: string;
  name: string;
  size: number;
  format: ImageFormat;
  width: number;
  height: number;
  rotation: Rotation;
  png: Blob;
  jpeg?: Blob;
  previewUrl: string;
  note: string;
}
export interface PdfOptions {
  pageSize: 'auto' | 'a4' | 'letter' | 'legal' | 'a3' | 'a5';
  orientation: 'auto' | 'portrait' | 'landscape';
  fit: 'fit' | 'fill' | 'actual';
  margin: 'none' | 'small' | 'medium' | 'large';
  background: 'white' | 'black';
  quality: 'standard' | 'high' | 'maximum';
  filename: string;
}
export const DEFAULT_OPTIONS: PdfOptions = {
  pageSize: 'a4',
  orientation: 'auto',
  fit: 'fit',
  margin: 'small',
  background: 'white',
  quality: 'high',
  filename: 'images.pdf',
};
export interface Progress {
  stage: string;
  completed: number;
  total: number;
}
export interface PdfOutput {
  blob: Blob;
  name: string;
  pages: number;
}
export interface Raster {
  width: number;
  height: number;
  png: Blob;
}
