declare module 'libheif-js/libheif-wasm/libheif-bundle.mjs' {
  interface HeifImage {
    get_width(): number;
    get_height(): number;
    is_primary(): boolean;
    display(data: ImageData, callback: (data: ImageData | null) => void): void;
    free(): void;
  }
  interface HeifModule {
    HeifDecoder: new () => { decode(bytes: Uint8Array): HeifImage[] };
  }
  export default function createModule(options?: {
    print?: (message: string) => void;
    printErr?: (message: string) => void;
  }): Promise<HeifModule>;
}
