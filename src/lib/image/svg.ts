import { UserError } from '../utils';
import { checkDimensions, LIMITS } from '../validation/limits';
const elements = new Set([
  'svg',
  'g',
  'defs',
  'title',
  'desc',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
]);
const attributes = new Set([
  'xmlns',
  'xmlns:xlink',
  'version',
  'width',
  'height',
  'viewBox',
  'preserveAspectRatio',
  'id',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-dasharray',
  'stroke-dashoffset',
  'opacity',
  'transform',
  'd',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'fx',
  'fy',
  'points',
  'offset',
  'stop-color',
  'stop-opacity',
  'gradientUnits',
  'gradientTransform',
  'spreadMethod',
  'clip-path',
  'clip-rule',
  'clipPathUnits',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-anchor',
  'dominant-baseline',
  'letter-spacing',
  'dx',
  'dy',
  'xml:space',
]);
export function safeSvg(text: string): {
  blob: Blob;
  width: number;
  height: number;
} {
  if (text.length > LIMITS.svgBytes)
    throw new UserError('SVG exceeds the 2 MB vector safety limit.');
  if (/<!DOCTYPE|<!ENTITY/i.test(text))
    throw new UserError(
      'SVG document types and entities are not supported. Export a PNG instead.',
    );
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (
    doc.querySelector('parsererror') ||
    doc.documentElement.localName !== 'svg' ||
    doc.documentElement.namespaceURI !== 'http://www.w3.org/2000/svg'
  )
    throw new UserError('This SVG is malformed.');
  const nodes = [...doc.querySelectorAll('*')];
  if (nodes.length > 10000)
    throw new UserError(
      'SVG has too many elements. Simplify it or export a PNG.',
    );
  for (const node of nodes) {
    if (
      !elements.has(node.localName) ||
      node.namespaceURI !== 'http://www.w3.org/2000/svg'
    )
      throw new UserError(
        'SVG contains active or unsupported content. Use a static SVG with shapes and text, or export a PNG.',
      );
    for (const attr of [...node.attributes]) {
      const value = attr.value;
      if (
        !attributes.has(attr.name) ||
        (/javascript:|data:|https?:|\/\/|@|[\\<>]/i.test(value) &&
          !attr.name.startsWith('xmlns')) ||
        (/url\(/i.test(value) && !/^url\(#[a-zA-Z_][\w.-]*\)$/.test(value))
      )
        throw new UserError(
          'SVG contains external references or unsafe attributes. Export a self-contained static SVG or PNG.',
        );
    }
  }
  const root = doc.documentElement;
  const vb = (root.getAttribute('viewBox') ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const length = (value: string | null, fallback: number) =>
    value && /^\d+(?:\.\d+)?(?:px)?$/.test(value)
      ? Math.ceil(parseFloat(value))
      : Math.ceil(fallback);
  const width = length(
    root.getAttribute('width'),
    vb.length === 4 ? vb[2] : 300,
  );
  const height = length(
    root.getAttribute('height'),
    vb.length === 4 ? vb[3] : 150,
  );
  checkDimensions(width, height);
  root.setAttribute('width', String(width));
  root.setAttribute('height', String(height));
  return {
    blob: new Blob([new XMLSerializer().serializeToString(doc)], {
      type: 'image/svg+xml',
    }),
    width,
    height,
  };
}
