import { useState, useCallback, useEffect, useRef } from 'react';

export interface ChannelState {
  r: boolean;
  g: boolean;
  b: boolean;
  a: boolean;
}

export interface LevelsSettings {
  black: number;
  white: number;
  gamma: number;
}

export interface FilterSettings {
  master: LevelsSettings;
  r: LevelsSettings;
  g: LevelsSettings;
  b: LevelsSettings;
  a: LevelsSettings;
}

export const INITIAL_LEVELS: LevelsSettings = { black: 0, white: 255, gamma: 1.0 };
export const INITIAL_FILTER: FilterSettings = {
  master: { ...INITIAL_LEVELS },
  r: { ...INITIAL_LEVELS },
  g: { ...INITIAL_LEVELS },
  b: { ...INITIAL_LEVELS },
  a: { ...INITIAL_LEVELS },
};

export function useImageProcessor() {
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [displayImageData, setDisplayImageData] = useState<ImageData | null>(null);
  const [channels, setChannels] = useState<ChannelState>({ r: true, g: true, b: true, a: true });
  const [levelsSettings, setLevelsSettings] = useState<FilterSettings>(INITIAL_FILTER);
  const [histograms, setHistograms] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);
  const isWorkerBusyRef = useRef(false);
  const pendingRequestRef = useRef<{ settings: FilterSettings, computeHist: boolean } | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);

  const sendToWorker = useCallback((settings: FilterSettings, computeHist: boolean) => {
    if (!originalImageData || !workerRef.current) return;

    isWorkerBusyRef.current = true;
    
    // Only show "processing" indicator if it takes more than 150ms
    if (!processingTimeoutRef.current) {
        processingTimeoutRef.current = window.setTimeout(() => {
            setIsProcessing(true);
        }, 150);
    }

    workerRef.current.postMessage({
      imageData: {
        width: originalImageData.width,
        height: originalImageData.height,
        data: originalImageData.data
      },
      channels,
      levelsSettings: settings,
      computeHistogram: computeHist
    });
  }, [originalImageData, channels]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./imageWorker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e: MessageEvent) => {
      const { imageData, histograms } = e.data;
      if (imageData) setDisplayImageData(imageData);
      if (histograms) setHistograms(histograms);
      
      isWorkerBusyRef.current = false;
      setIsProcessing(false);
      
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }

      // If we have a pending request, send it now
      if (pendingRequestRef.current) {
        const { settings, computeHist } = pendingRequestRef.current;
        pendingRequestRef.current = null;
        sendToWorker(settings, computeHist);
      }
    };

    return () => {
      workerRef.current?.terminate();
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
    };
  }, [sendToWorker]);

  const toggleChannel = useCallback((channel: keyof ChannelState) => {
    setChannels(prev => ({ ...prev, [channel]: !prev[channel] }));
  }, []);

  const applySettings = useCallback((newSettings: FilterSettings, computeHist: boolean = false) => {
    if (isWorkerBusyRef.current) {
      pendingRequestRef.current = { settings: newSettings, computeHist };
    } else {
      sendToWorker(newSettings, computeHist);
    }
  }, [sendToWorker]);

  useEffect(() => {
    if (!originalImageData) {
        setDisplayImageData(null);
        setHistograms(null);
        return;
    }
    applySettings(levelsSettings, true);
  }, [originalImageData, channels, levelsSettings, applySettings]);

  return {
    originalImageData,
    setOriginalImageData,
    displayImageData,
    channels,
    toggleChannel,
    levelsSettings,
    setLevelsSettings,
    histograms,
    isProcessing,
    applySettings
  };
}
