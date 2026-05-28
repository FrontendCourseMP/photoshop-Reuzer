interface LevelsSettings {
  black: number;
  white: number;
  gamma: number;
}

interface ChannelState {
  r: boolean;
  g: boolean;
  b: boolean;
  a: boolean;
}

interface FilterSettings {
  master: LevelsSettings;
  r: LevelsSettings;
  g: LevelsSettings;
  b: LevelsSettings;
  a: LevelsSettings;
}

type HistogramData = Record<keyof FilterSettings, Uint32Array>;

interface WorkerImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

interface ImageWorkerRequest {
  imageData: WorkerImageData;
  channels: ChannelState;
  levelsSettings: FilterSettings | null;
  computeHistogram: boolean;
}

const ctx = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent<ImageWorkerRequest>) => {
  const { imageData, channels, levelsSettings, computeHistogram } = e.data;
  const { width, height, data } = imageData;
  
  let resultImageData: ImageData | null = null;

  // 1. Apply Levels if requested
  if (levelsSettings) {
    const luts = {
      r: createLUT(levelsSettings.r, levelsSettings.master),
      g: createLUT(levelsSettings.g, levelsSettings.master),
      b: createLUT(levelsSettings.b, levelsSettings.master),
      a: createLUT(levelsSettings.a),
    };

    const outputBuffer = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
      outputBuffer[i] = luts.r[data[i]];
      outputBuffer[i + 1] = luts.g[data[i + 1]];
      outputBuffer[i + 2] = luts.b[data[i + 2]];
      outputBuffer[i + 3] = luts.a[data[i + 3]];
    }
    
    // 2. Apply channel visibility
    if (!channels.r || !channels.g || !channels.b || !channels.a) {
        if (!channels.r && !channels.g && !channels.b && channels.a) {
          for (let i = 0; i < outputBuffer.length; i += 4) {
            const alpha = outputBuffer[i + 3];
            outputBuffer[i] = alpha;
            outputBuffer[i + 1] = alpha;
            outputBuffer[i + 2] = alpha;
            outputBuffer[i + 3] = 255;
          }
        } else {
          for (let i = 0; i < outputBuffer.length; i += 4) {
            if (!channels.r) outputBuffer[i] = 0;
            if (!channels.g) outputBuffer[i + 1] = 0;
            if (!channels.b) outputBuffer[i + 2] = 0;
            if (!channels.a) outputBuffer[i + 3] = 255;
          }
        }
    }

    resultImageData = new ImageData(outputBuffer, width, height);
  }

  // 3. Compute Histogram if requested
  let histograms: HistogramData | null = null;
  if (computeHistogram) {
    histograms = {
      r: new Uint32Array(256),
      g: new Uint32Array(256),
      b: new Uint32Array(256),
      a: new Uint32Array(256),
      master: new Uint32Array(256)
    };

    const sourceData = resultImageData ? resultImageData.data : data;

    for (let i = 0; i < sourceData.length; i += 4) {
      const r = sourceData[i];
      const g = sourceData[i + 1];
      const b = sourceData[i + 2];
      const a = sourceData[i + 3];
      
      histograms.r[r]++;
      histograms.g[g]++;
      histograms.b[b]++;
      histograms.a[a]++;
      
      const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      histograms.master[l]++;
    }
  }

  ctx.postMessage({
    imageData: resultImageData,
    histograms: histograms
  }, resultImageData ? [resultImageData.data.buffer] : []);
};

function createLUT(settings: LevelsSettings, master?: LevelsSettings): Uint8Array {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let val = i;
    
    // Apply channel-specific levels
    val = applyLevels(val, settings);
    
    // Apply master levels if provided
    if (master) {
      val = applyLevels(val, master);
    }
    
    lut[i] = val;
  }
  return lut;
}

function applyLevels(v: number, s: LevelsSettings): number {
  // 1. Map [black, white] to [0, 255]
  if (v <= s.black) return 0;
  if (v >= s.white) return 255;
  
  let res = (v - s.black) / (s.white - s.black);
  
  // 2. Apply Gamma
  // res is 0..1. Output = res ^ (1/gamma)
  res = Math.pow(res, 1 / s.gamma);
  
  return Math.round(res * 255);
}

export {};
