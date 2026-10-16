import { useRef, useState } from 'react';
import {
  Plus,
  FileImage,
  LockKeyhole,
  Check,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import type { useConverter } from '../hooks/useConverter';
import { ACCEPT } from '../lib/image/detect';
import { ImageCard } from './ImageCard';
export function Workspace({
  session,
}: {
  session: ReturnType<typeof useConverter>;
}) {
  const { images, picker, busy, ingest, clear, move, turn, remove } = session;
  const [dragging, setDragging] = useState(false),
    dragged = useRef('');
  return (
    <div
      className={`workspace ${dragging ? 'dragging' : ''}`}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!busy && event.dataTransfer.files.length)
          void ingest(Array.from(event.dataTransfer.files));
      }}
    >
      <input
        hidden
        ref={picker}
        aria-label="Image file picker"
        type="file"
        accept={ACCEPT}
        multiple
        disabled={busy}
        onChange={(event) => {
          void ingest(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      {!images.length ? (
        <div className="dropzone">
          <div className="paper-art" aria-hidden="true">
            <div className="paper back">
              <FileImage size={34} strokeWidth={1.2} />
            </div>
            <div className="paper front">
              <span>PDF</span>
              <i />
              <i />
              <i />
              <div>
                <Check size={24} strokeWidth={1.5} />
              </div>
            </div>
            <span className="art-star">✦</span>
          </div>
          <h2>A place for your pictures.</h2>
          <p>Drag & drop images here. We’ll bring them together.</p>
          <button
            className="button primary browse-button"
            onClick={() => picker.current?.click()}
            disabled={busy}
          >
            <Plus size={18} />
            Choose images
          </button>
          <span className="drop-hint">JPG, PNG, WebP, HEIC, TIFF & more</span>
          <span className="drop-hint">Up to 50 pages · 40 MB per image</span>
          <div className="sample-divider">
            <span />
            JUST EXPLORING?
            <span />
          </div>
          <button
            className="sample-button"
            onClick={() => void ingest('samples')}
            disabled={busy}
          >
            Try sample images <ArrowUpRight size={15} />
          </button>
          <span className="sample-hint">
            Four little studies in color, shape & transparency
          </span>
        </div>
      ) : (
        <>
          <div className="workspace-toolbar">
            <div>
              <h2>Arrange your pages.</h2>
              <p>
                {images.length} page{images.length === 1 ? '' : 's'} · in the
                order shown below
              </p>
            </div>
            <div className="toolbar-actions">
              <button
                className="text-button"
                disabled={busy}
                onClick={() => picker.current?.click()}
              >
                <Plus size={15} />
                Add images
              </button>
              <button
                className="icon-button"
                disabled={busy}
                onClick={clear}
                aria-label="Clear all images"
                title="Clear all images"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <p className="reorder-hint">
            Drag a handle, use the arrows, or press Alt + ↑ / ↓ on a handle.
          </p>
          <ol className="image-grid" aria-label="Image pages">
            {images.map((item, index) => (
              <ImageCard
                key={item.id}
                item={item}
                index={index}
                count={images.length}
                busy={busy}
                onMove={move}
                onTurn={turn}
                onRemove={remove}
                onDrag={(id) => {
                  dragged.current = id;
                }}
                onDrop={() => {
                  move(dragged.current, index);
                  dragged.current = '';
                }}
              />
            ))}
          </ol>
        </>
      )}
      <div className="workspace-footnote">
        <LockKeyhole size={14} />
        <span>Processed on your device. Never on a server.</span>
        <Check size={14} />
      </div>
    </div>
  );
}
