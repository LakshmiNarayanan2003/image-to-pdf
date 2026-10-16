import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Settings } from './Settings';
import { ImageCard } from './ImageCard';
import { DEFAULT_OPTIONS, type ImageItem } from '../lib/types';
const props = {
  options: DEFAULT_OPTIONS,
  onChange: vi.fn(),
  busy: false,
  count: 1,
  progress: null,
  onConvert: vi.fn(),
  onCancel: vi.fn(),
};
it('labels every PDF setting and updates page size', async () => {
  render(<Settings {...props} />);
  await userEvent.selectOptions(screen.getByLabelText('Page size'), 'letter');
  expect(props.onChange).toHaveBeenCalledWith({
    ...DEFAULT_OPTIONS,
    pageSize: 'letter',
  });
  for (const label of [
    'Orientation',
    'Image fit',
    'Margins',
    'Background',
    'PDF quality',
    'Output filename',
  ])
    expect(screen.getByLabelText(label)).toBeVisible();
});
it('disables conversion without pages', () => {
  render(<Settings {...props} count={0} />);
  expect(screen.getByRole('button', { name: 'Create PDF' })).toBeDisabled();
});
it('announces progress, disables settings and allows cancellation', async () => {
  render(
    <Settings
      {...props}
      busy
      progress={{ stage: 'Adding 2 of 3', completed: 1, total: 3 }}
    />,
  );
  expect(screen.getByLabelText('Page size')).toBeDisabled();
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1');
  await userEvent.click(
    screen.getByRole('button', { name: 'Cancel processing' }),
  );
  expect(props.onCancel).toHaveBeenCalled();
});
it('explains quality and clipping without misleading lossless claims', () => {
  const { rerender } = render(
    <Settings
      {...props}
      options={{ ...DEFAULT_OPTIONS, quality: 'maximum', fit: 'fill' }}
    />,
  );
  expect(
    screen.getByText(/eligible JPEGs without recompression/),
  ).toBeVisible();
  expect(screen.getByText(/edges may be cropped/)).toBeVisible();
  rerender(
    <Settings
      {...props}
      options={{ ...DEFAULT_OPTIONS, quality: 'standard' }}
    />,
  );
  expect(screen.getByText(/2400 px/)).toBeVisible();
});
const item: ImageItem = {
  id: 'a',
  sourceId: 'a',
  name: '<img onerror=alert(1)>.png',
  format: 'png',
  size: 100,
  width: 100,
  height: 200,
  rotation: 90,
  png: new Blob(),
  previewUrl: 'blob:preview',
  note: '',
};
it('renders filenames as text and rotated metadata accurately', () => {
  render(
    <ImageCard
      item={item}
      index={0}
      count={2}
      busy={false}
      onMove={() => {}}
      onTurn={() => {}}
      onRemove={() => {}}
      onDrag={() => {}}
      onDrop={() => {}}
    />,
  );
  expect(screen.getByRole('heading')).toHaveTextContent(item.name);
  expect(screen.getByText(/200 × 100/)).toBeVisible();
  expect(screen.getByText(/Landscape · 90°/)).toBeVisible();
  expect(screen.getAllByRole('img')).toHaveLength(1);
});
it('supports keyboard reordering and move-button fallback', async () => {
  const move = vi.fn();
  render(
    <ImageCard
      item={item}
      index={1}
      count={3}
      busy={false}
      onMove={move}
      onTurn={() => {}}
      onRemove={() => {}}
      onDrag={() => {}}
      onDrop={() => {}}
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: /^Move up/ }));
  expect(move).toHaveBeenCalledWith('a', 0);
  screen.getByRole('button', { name: /^Reorder/ }).focus();
  await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
  expect(move).toHaveBeenCalledWith('a', 2);
});
