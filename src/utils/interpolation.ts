export type InterpolationMethod = 'nearest' | 'bilinear';

export interface InterpolationOption {
  value: InterpolationMethod;
  label: string;
  description: string;
}

export const INTERPOLATION_OPTIONS: InterpolationOption[] = [
  {
    value: 'bilinear',
    label: 'Билинейная',
    description: 'Сглаживает изображение за счет усреднения четырех соседних пикселей. Хороший вариант по умолчанию.',
  },
  {
    value: 'nearest',
    label: 'Ближайший сосед',
    description: 'Берет ближайший исходный пиксель без смешивания. Быстро работает и сохраняет резкие пиксельные края.',
  },
];

export const MIN_VIEW_SCALE = 12;
export const MAX_VIEW_SCALE = 300;
const INITIAL_FIT_FILL_RATIO = 0.72;

export function resizeImageData(
  source: ImageData,
  targetWidth: number,
  targetHeight: number,
  method: InterpolationMethod = 'bilinear'
): ImageData {
  const width = sanitizeDimension(targetWidth);
  const height = sanitizeDimension(targetHeight);

  if (source.width === width && source.height === height) {
    return new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  }

  const output = new ImageData(width, height);

  if (method === 'nearest') {
    resizeNearest(source, output);
  } else {
    resizeBilinear(source, output);
  }

  return output;
}

export function clampViewScale(scale: number): number {
  return Math.min(MAX_VIEW_SCALE, Math.max(MIN_VIEW_SCALE, Math.round(scale)));
}

export function calculateFitScale(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding = 50
): number {
  if (imageWidth <= 0 || imageHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return 100;
  }

  const availableWidth = Math.max(1, viewportWidth - padding * 2);
  const availableHeight = Math.max(1, viewportHeight - padding * 2);
  const targetWidth = availableWidth * INITIAL_FIT_FILL_RATIO;
  const targetHeight = availableHeight * INITIAL_FIT_FILL_RATIO;
  const scale = Math.min(targetWidth / imageWidth, targetHeight / imageHeight) * 100;

  return clampViewScale(scale);
}

export function getInterpolationOption(method: InterpolationMethod): InterpolationOption {
  return INTERPOLATION_OPTIONS.find(option => option.value === method) ?? INTERPOLATION_OPTIONS[0];
}

function resizeNearest(source: ImageData, output: ImageData) {
  const xRatio = source.width / output.width;
  const yRatio = source.height / output.height;

  for (let y = 0; y < output.height; y++) {
    const sourceY = clamp(Math.round((y + 0.5) * yRatio - 0.5), 0, source.height - 1);

    for (let x = 0; x < output.width; x++) {
      const sourceX = clamp(Math.round((x + 0.5) * xRatio - 0.5), 0, source.width - 1);
      copyPixel(source.data, output.data, (sourceY * source.width + sourceX) * 4, (y * output.width + x) * 4);
    }
  }
}

function resizeBilinear(source: ImageData, output: ImageData) {
  const xRatio = source.width / output.width;
  const yRatio = source.height / output.height;

  for (let y = 0; y < output.height; y++) {
    const sourceY = (y + 0.5) * yRatio - 0.5;
    const y0 = clamp(Math.floor(sourceY), 0, source.height - 1);
    const y1 = clamp(y0 + 1, 0, source.height - 1);
    const yWeight = clamp(sourceY - y0, 0, 1);

    for (let x = 0; x < output.width; x++) {
      const sourceX = (x + 0.5) * xRatio - 0.5;
      const x0 = clamp(Math.floor(sourceX), 0, source.width - 1);
      const x1 = clamp(x0 + 1, 0, source.width - 1);
      const xWeight = clamp(sourceX - x0, 0, 1);

      const topLeft = (y0 * source.width + x0) * 4;
      const topRight = (y0 * source.width + x1) * 4;
      const bottomLeft = (y1 * source.width + x0) * 4;
      const bottomRight = (y1 * source.width + x1) * 4;
      const targetIndex = (y * output.width + x) * 4;

      for (let channel = 0; channel < 4; channel++) {
        const top = lerp(source.data[topLeft + channel], source.data[topRight + channel], xWeight);
        const bottom = lerp(source.data[bottomLeft + channel], source.data[bottomRight + channel], xWeight);
        output.data[targetIndex + channel] = Math.round(lerp(top, bottom, yWeight));
      }
    }
  }
}

function copyPixel(source: Uint8ClampedArray, target: Uint8ClampedArray, sourceIndex: number, targetIndex: number) {
  target[targetIndex] = source[sourceIndex];
  target[targetIndex + 1] = source[sourceIndex + 1];
  target[targetIndex + 2] = source[sourceIndex + 2];
  target[targetIndex + 3] = source[sourceIndex + 3];
}

function sanitizeDimension(value: number): number {
  return Math.max(1, Math.round(value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
