import { useState, useCallback, useEffect, useRef } from 'react';

export interface ChannelState {
  r: boolean;
  g: boolean;
  b: boolean;
  a: boolean;
}

export function useImageProcessor() {
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [displayImageData, setDisplayImageData] = useState<ImageData | null>(null);
  const [channels, setChannels] = useState<ChannelState>({ r: true, g: true, b: true, a: true });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('./imageWorker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e: MessageEvent) => {
      setDisplayImageData(e.data);
      setIsProcessing(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const toggleChannel = useCallback((channel: keyof ChannelState) => {
    setChannels(prev => ({ ...prev, [channel]: !prev[channel] }));
  }, []);

  useEffect(() => {
    if (!originalImageData || !workerRef.current) {
      setDisplayImageData(originalImageData);
      return;
    }

    setIsProcessing(true);
    // Send data to worker. Note: we might want to avoid cloning originalImageData.data if possible,
    // but Worker.postMessage clones by default unless transferred. 
    // We keep originalImageData in state, so we clone it to the worker.
    workerRef.current.postMessage({
      imageData: {
        width: originalImageData.width,
        height: originalImageData.height,
        data: originalImageData.data // This is cloned
      },
      channels
    });
  }, [originalImageData, channels]);

  return {
    originalImageData,
    setOriginalImageData,
    displayImageData,
    channels,
    toggleChannel,
    isProcessing
  };
}
