import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
  X,
  GripVertical,
} from 'lucide-react';
import type { ImageItem } from '../lib/types';
import { formatBytes, rotatedSize } from '../lib/utils';
interface Props {
  item: ImageItem;
  index: number;
  count: number;
  busy: boolean;
  onMove: (id: string, target: number) => void;
  onTurn: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onDrag: (id: string) => void;
  onDrop: () => void;
}
export function ImageCard({
  item,
  index,
  count,
  busy,
  onMove,
  onTurn,
  onRemove,
  onDrag,
  onDrop,
}: Props) {
  const size = rotatedSize(item.width, item.height, item.rotation);
  const actionName = `${item.name}, page ${index + 1}`;
  return (
    <li
      className="image-card"
      data-id={item.id}
      onDragOver={(event) => {
        if (!busy && event.dataTransfer.types.includes('text/x-pix2pdf'))
          event.preventDefault();
      }}
      onDrop={(event) => {
        if (event.dataTransfer.types.includes('text/x-pix2pdf')) {
          event.preventDefault();
          event.stopPropagation();
          onDrop();
        }
      }}
    >
      <div className="card-top">
        <span className="page-number">
          {String(index + 1).padStart(2, '0')}
        </span>
        <button
          className="icon-button drag-handle"
          aria-label={`Reorder ${actionName}`}
          title="Drag to reorder, or use Alt + arrow up/down"
          disabled={busy}
          draggable={!busy}
          onDragStart={(event) => {
            event.dataTransfer.setData('text/x-pix2pdf', item.id);
            event.dataTransfer.effectAllowed = 'move';
            onDrag(item.id);
          }}
          onKeyDown={(event) => {
            if (event.altKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
              event.preventDefault();
              onMove(item.id, index + (event.key === 'ArrowUp' ? -1 : 1));
            }
          }}
        >
          <GripVertical size={17} />
        </button>
      </div>
      <div className="thumbnail-stage">
        <img
          src={item.previewUrl}
          alt={`Preview of ${item.name}`}
          className={`rotation-${item.rotation}`}
          draggable={false}
        />
      </div>
      <div className="card-meta">
        <h3 title={item.name}>{item.name}</h3>
        <p>
          {size.width} × {size.height} · {formatBytes(item.size)}
        </p>
        <p>
          {item.format.toUpperCase()} ·{' '}
          {size.width === size.height
            ? 'Square'
            : size.width > size.height
              ? 'Landscape'
              : 'Portrait'}
          {item.rotation ? ` · ${item.rotation}°` : ''}
        </p>
        {item.note && <p className="format-note">{item.note}</p>}
      </div>
      <div className="card-actions">
        <button
          className="icon-button"
          aria-label={`Move up ${actionName}`}
          disabled={busy || index === 0}
          onClick={() => onMove(item.id, index - 1)}
        >
          <ArrowUp size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={`Move down ${actionName}`}
          disabled={busy || index === count - 1}
          onClick={() => onMove(item.id, index + 1)}
        >
          <ArrowDown size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={`Rotate left ${actionName}`}
          disabled={busy}
          onClick={() => onTurn(item.id, -90)}
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={`Rotate right ${actionName}`}
          disabled={busy}
          onClick={() => onTurn(item.id, 90)}
        >
          <RotateCw size={16} />
        </button>
        <button
          className="icon-button remove-button"
          aria-label={`Remove ${actionName}`}
          disabled={busy}
          onClick={() => onRemove(item.id)}
        >
          <X size={17} />
        </button>
      </div>
    </li>
  );
}
