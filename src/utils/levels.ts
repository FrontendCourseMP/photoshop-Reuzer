import type { FilterSettings, LevelsSettings } from '../hooks/useImageProcessor';

export function applyLevelsToImageData(imageData: ImageData, settings: FilterSettings): ImageData {
  const luts = {
    r: createLUT(settings.r, settings.master),
    g: createLUT(settings.g, settings.master),
    b: createLUT(settings.b, settings.master),
    a: createLUT(settings.a),
  };
  const output = new ImageData(imageData.width, imageData.height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    output.data[i] = luts.r[imageData.data[i]];
    output.data[i + 1] = luts.g[imageData.data[i + 1]];
    output.data[i + 2] = luts.b[imageData.data[i + 2]];
    output.data[i + 3] = luts.a[imageData.data[i + 3]];
  }

  return output;
}

function createLUT(settings: LevelsSettings, master?: LevelsSettings): Uint8Array {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let value = applyLevels(i, settings);
    if (master) value = applyLevels(value, master);
    lut[i] = value;
  }

  return lut;
}

function applyLevels(value: number, settings: LevelsSettings): number {
  if (value <= settings.black) return 0;
  if (value >= settings.white) return 255;

  const normalized = (value - settings.black) / (settings.white - settings.black);
  return Math.round(Math.pow(normalized, 1 / settings.gamma) * 255);
}
