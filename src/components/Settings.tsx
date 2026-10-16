import { FileDown, ArrowUpRight } from 'lucide-react';
import type { PdfOptions, Progress } from '../lib/types';
interface Props {
  options: PdfOptions;
  onChange: (value: PdfOptions) => void;
  busy: boolean;
  count: number;
  progress: Progress | null;
  onConvert: () => void;
  onCancel: () => void;
}
export function Settings({
  options,
  onChange,
  busy,
  count,
  progress,
  onConvert,
  onCancel,
}: Props) {
  const update = (patch: Partial<PdfOptions>) =>
    onChange({ ...options, ...patch });
  return (
    <aside className="settings" aria-labelledby="settings-title">
      <div className="section-label">MAKE IT YOURS</div>
      <h2 id="settings-title">PDF settings</h2>
      <fieldset disabled={busy}>
        <legend className="sr-only">Page layout and output</legend>
        <label htmlFor="page-size">Page size</label>
        <select
          id="page-size"
          value={options.pageSize}
          onChange={(e) =>
            update({ pageSize: e.target.value as PdfOptions['pageSize'] })
          }
        >
          <option value="auto">Match image · 96 DPI</option>
          <option value="a4">A4 · 210 × 297 mm</option>
          <option value="letter">Letter · 8.5 × 11 in</option>
          <option value="legal">Legal · 8.5 × 14 in</option>
          <option value="a3">A3 · 297 × 420 mm</option>
          <option value="a5">A5 · 148 × 210 mm</option>
        </select>
        {options.pageSize === 'auto' && (
          <p className="setting-note">
            Each page follows its image. Content is capped at 20 inches per
            side, plus margins.
          </p>
        )}
        <div className="settings-row">
          <div>
            <label htmlFor="orientation">Orientation</label>
            <select
              id="orientation"
              value={options.orientation}
              onChange={(e) =>
                update({
                  orientation: e.target.value as PdfOptions['orientation'],
                })
              }
            >
              <option value="auto">Auto</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div>
            <label htmlFor="fit">Image fit</label>
            <select
              id="fit"
              value={options.fit}
              onChange={(e) =>
                update({ fit: e.target.value as PdfOptions['fit'] })
              }
            >
              <option value="fit">Fit</option>
              <option value="fill">Fill</option>
              <option value="actual">Original size</option>
            </select>
          </div>
        </div>
        <p className="setting-note">
          {options.fit === 'fit'
            ? 'Keeps the whole image visible, without stretching.'
            : options.fit === 'fill'
              ? 'Fills the space inside margins. Image edges may be cropped.'
              : 'Places pixels at 96 DPI. Parts outside the margins are cropped.'}
        </p>
        <div className="settings-row">
          <div>
            <label htmlFor="margin">Margins</label>
            <select
              id="margin"
              value={options.margin}
              onChange={(e) =>
                update({ margin: e.target.value as PdfOptions['margin'] })
              }
            >
              <option value="none">None · 0 mm</option>
              <option value="small">Small · 5 mm</option>
              <option value="medium">Medium · 10 mm</option>
              <option value="large">Large · 20 mm</option>
            </select>
          </div>
          <div>
            <label htmlFor="background">Background</label>
            <select
              id="background"
              value={options.background}
              onChange={(e) =>
                update({
                  background: e.target.value as PdfOptions['background'],
                })
              }
            >
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </div>
        </div>
        <label htmlFor="quality">PDF quality</label>
        <select
          id="quality"
          value={options.quality}
          aria-describedby="quality-note"
          onChange={(e) =>
            update({ quality: e.target.value as PdfOptions['quality'] })
          }
        >
          <option value="standard">Standard · smaller files</option>
          <option value="high">High · balanced detail</option>
          <option value="maximum">Maximum · original resolution</option>
        </select>
        <p className="setting-note" id="quality-note">
          {options.quality === 'standard'
            ? 'JPEG at 85% quality; longest side up to 2400 px.'
            : options.quality === 'high'
              ? 'JPEG at 95% quality; longest side up to 4096 px.'
              : 'Keeps decoded pixels as PNG, or embeds eligible JPEGs without recompression. Larger files.'}
        </p>
        <label htmlFor="filename">Output filename</label>
        <input
          id="filename"
          value={options.filename}
          onChange={(e) => update({ filename: e.target.value })}
          maxLength={150}
          spellCheck={false}
        />
        <p className="setting-note">
          Unsafe characters are replaced. Always saved as .pdf.
        </p>
      </fieldset>
      <div className="export-area">
        {progress && (
          <div className="progress">
            <div role="status">{progress.stage}</div>
            <progress
              aria-label="Conversion progress"
              max={progress.total}
              value={progress.completed}
            />
          </div>
        )}
        {busy ? (
          <button className="button secondary full" onClick={onCancel}>
            Cancel processing
          </button>
        ) : (
          <button
            className="button primary full"
            disabled={!count}
            onClick={onConvert}
          >
            <FileDown size={19} />
            Create PDF
            <ArrowUpRight size={17} className="export-arrow" />
          </button>
        )}
        <p className="export-caption">
          {count
            ? `${count} image page${count === 1 ? '' : 's'} → one PDF. Made on your device.`
            : 'Add images to get started.'}
        </p>
      </div>
    </aside>
  );
}
