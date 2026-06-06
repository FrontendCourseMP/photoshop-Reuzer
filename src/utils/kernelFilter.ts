import type { KernelFilterSettings } from '../types/kernelFilter';

export function applyKernelFilterToImageData(imageData: ImageData, settings: KernelFilterSettings): ImageData {
  if (settings.kernel.length !== 9) {
    return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  }

  const output = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const selectedChannels = [
    settings.channels.r,
    settings.channels.g,
    settings.channels.b,
    settings.channels.a,
  ];

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      const targetIndex = (y * imageData.width + x) * 4;

      for (let channel = 0; channel < 4; channel++) {
        if (!selectedChannels[channel]) continue;

        let sum = 0;
        for (let kernelY = -1; kernelY <= 1; kernelY++) {
          for (let kernelX = -1; kernelX <= 1; kernelX++) {
            const kernelIndex = (kernelY + 1) * 3 + (kernelX + 1);
            const sample = getSample(imageData.data, imageData.width, imageData.height, x + kernelX, y + kernelY, channel, settings);
            sum += sample * settings.kernel[kernelIndex];
          }
        }

        output.data[targetIndex + channel] = clampByte(Math.round(sum));
      }
    }
  }

  return output;
}

function getSample(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number,
  settings: KernelFilterSettings
): number {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    return source[(y * width + x) * 4 + channel];
  }

  if (settings.edgeHandling === 'black') return 0;
  if (settings.edgeHandling === 'white') return 255;

  const clampedX = Math.min(width - 1, Math.max(0, x));
  const clampedY = Math.min(height - 1, Math.max(0, y));
  return source[(clampedY * width + clampedX) * 4 + channel];
}

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, value));
}
