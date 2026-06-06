import { useState, useCallback, memo } from 'react';
import type { ChangeEvent } from 'react';
import { 
  Box, CssBaseline, GlobalStyles, ThemeProvider, createTheme 
} from '@mui/material';
import { createInitialFilter, useImageProcessor } from './hooks/useImageProcessor';
import { ToolBar } from './components/ToolBar';
import { ImageCanvas } from './components/ImageCanvas';
import { ChannelsPanel } from './components/ChannelsPanel';
import { InfoPanel } from './components/InfoPanel';
import { LevelsDialog } from './components/LevelsDialog';
import { KernelFilterDialog } from './components/KernelFilterDialog';
import { ResizeDialog } from './components/ResizeDialog';
import { StatusBar } from './components/StatusBar';
import { handleImageFile, downloadImage } from './utils/fileHandler';
import { EMPTY_IMAGE_INFO } from './types/image';
import {
  clampViewScale,
  type InterpolationMethod,
} from './utils/interpolation';
import { applyLevelsToImageData } from './utils/levels';
import { applyKernelFilterToImageData } from './utils/kernelFilter';
import type { FilterSettings } from './hooks/useImageProcessor';
import type { KernelFilterSettings } from './types/kernelFilter';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#2ed3b7' },
    secondary: { main: '#f2b84b' },
    error: { main: '#ff6b6b' },
    background: { default: '#111216', paper: '#1b1d22' },
    divider: 'rgba(255,255,255,0.08)',
    text: {
      primary: '#f4f6f8',
      secondary: '#aeb4bd',
    },
  },
  typography: {
    fontFamily: ['Inter', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

const MemoizedInfoPanel = memo(InfoPanel);

const cloneImageData = (imageData: ImageData): ImageData => {
  return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
};

function App() {
  const { 
    originalImageData, 
    setOriginalImageData, 
    displayImageData, 
    channels, 
    toggleChannel,
    setChannels,
    levelsSettings,
    setLevelsSettings,
    kernelFilterSettings,
    setKernelFilterSettings,
    histograms,
    isProcessing
  } = useImageProcessor();

  const [imageInfo, setImageInfo] = useState(EMPTY_IMAGE_INFO);
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null);
  const [viewScalePercent, setViewScalePercent] = useState(100);
  const [interpolationMethod, setInterpolationMethod] = useState<InterpolationMethod>('bilinear');
  const [autoFitKey, setAutoFitKey] = useState(0);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [isLevelsOpen, setIsLevelsOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isKernelFilterOpen, setIsKernelFilterOpen] = useState(false);
  const [pickedPixel, setPickedPixel] = useState<{ x: number, y: number, r: number, g: number, b: number, a: number } | null>(null);

  const onFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleImageFile(
      file,
      (imageData, info) => {
        setOriginalImageData(imageData);
        setSourceImageData(cloneImageData(imageData));
        setChannels({ r: true, g: true, b: true, a: info.hasAlpha });
        setLevelsSettings(createInitialFilter());
        setKernelFilterSettings(null);
        setImageInfo(info);
        setPickedPixel(null);
        setAutoFitKey(key => key + 1);
      },
      (error) => alert(error)
    );
    event.target.value = '';
  }, [setOriginalImageData, setChannels, setLevelsSettings, setKernelFilterSettings]);

  const onDownload = useCallback((format: 'png' | 'jpg' | 'gb7') => {
    if (displayImageData) {
      try {
        downloadImage(displayImageData, format);
      } catch (error) {
        alert((error as Error).message);
      }
    }
  }, [displayImageData]);

  const onPixelClick = useCallback((x: number, y: number) => {
    if (!sourceImageData) return;

    const sourceX = Math.min(sourceImageData.width - 1, Math.max(0, x));
    const sourceY = Math.min(sourceImageData.height - 1, Math.max(0, y));
    const index = (sourceY * sourceImageData.width + sourceX) * 4;
    const r = sourceImageData.data[index];
    const g = sourceImageData.data[index + 1];
    const b = sourceImageData.data[index + 2];
    const a = sourceImageData.data[index + 3];

    setPickedPixel({ x: sourceX, y: sourceY, r, g, b, a });
  }, [sourceImageData]);

  const toggleEyedropper = useCallback(() => {
    setIsEyedropperActive(prev => !prev);
  }, []);

  const updateViewScale = useCallback((scale: number) => {
    setViewScalePercent(clampViewScale(scale));
  }, []);

  const onResizeApply = useCallback((resizedImageData: ImageData) => {
    setOriginalImageData(resizedImageData);
    setSourceImageData(cloneImageData(resizedImageData));
    setImageInfo(prev => ({
      ...prev,
      width: resizedImageData.width,
      height: resizedImageData.height,
      fileSize: 0,
    }));
    setPickedPixel(null);
    setAutoFitKey(key => key + 1);
    setIsResizeOpen(false);
  }, [setOriginalImageData]);

  const onLevelsCommit = useCallback((settings: FilterSettings) => {
    if (!originalImageData) return;

    setOriginalImageData(applyLevelsToImageData(originalImageData, settings));
    setLevelsSettings(createInitialFilter());
    setPickedPixel(null);
  }, [originalImageData, setLevelsSettings, setOriginalImageData]);

  const onKernelFilterApply = useCallback((settings: KernelFilterSettings | null) => {
    if (settings && originalImageData) {
      setOriginalImageData(applyKernelFilterToImageData(originalImageData, settings));
    }

    setKernelFilterSettings(null);
    setPickedPixel(null);
  }, [originalImageData, setKernelFilterSettings, setOriginalImageData]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GlobalStyles styles={{
        body: {
          background: '#111216',
          overflow: 'hidden',
        },
        '*::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },
        '*::-webkit-scrollbar-track': {
          background: '#15171b',
        },
        '*::-webkit-scrollbar-thumb': {
          background: '#3a3e47',
          borderRadius: 10,
          border: '2px solid #15171b',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: '#4a505c',
        },
      }} />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        minWidth: 0,
        bgcolor: 'background.default',
        color: 'text.primary',
      }}>
        
        <ToolBar 
          onFileUpload={onFileUpload}
          onDownload={onDownload}
          isEyedropperActive={isEyedropperActive}
          onToggleEyedropper={toggleEyedropper}
          onOpenLevels={() => setIsLevelsOpen(true)}
          onOpenResize={() => setIsResizeOpen(true)}
          onOpenKernelFilter={() => setIsKernelFilterOpen(true)}
          hasImage={!!originalImageData}
          imageInfo={imageInfo}
        />

        <Box sx={{ 
          flexGrow: 1, 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: isLevelsOpen ? '260px minmax(0, 1fr) 380px' : '260px minmax(0, 1fr) 300px',
          },
          minHeight: 0,
          overflow: 'hidden',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}>
          <ChannelsPanel 
            imageData={originalImageData}
            imageInfo={imageInfo}
            channels={channels}
            onToggle={toggleChannel}
            onChange={setChannels}
          />

          <ImageCanvas 
            imageData={displayImageData}
            isEyedropperActive={isEyedropperActive}
            onPixelClick={onPixelClick}
            isProcessing={isProcessing}
            scalePercent={viewScalePercent}
            interpolationMethod={interpolationMethod}
            autoFitKey={autoFitKey}
            onScaleChange={updateViewScale}
          />

          {isLevelsOpen ? (
            <LevelsDialog
              open={isLevelsOpen}
              onClose={() => setIsLevelsOpen(false)}
              onApply={setLevelsSettings}
              onCommit={onLevelsCommit}
              currentSettings={levelsSettings}
              histograms={histograms}
              imageInfo={imageInfo}
            />
          ) : (
            <MemoizedInfoPanel
              imageInfo={imageInfo}
              pickedPixel={pickedPixel}
              viewScalePercent={viewScalePercent}
              onViewScaleChange={updateViewScale}
              interpolationMethod={interpolationMethod}
              onInterpolationMethodChange={setInterpolationMethod}
            />
          )}
        </Box>

        <StatusBar 
          imageInfo={imageInfo}
          isProcessing={isProcessing}
          hasImage={!!originalImageData}
        />

        {isResizeOpen && originalImageData && (
          <ResizeDialog
            open={isResizeOpen}
            imageData={originalImageData}
            defaultMethod={interpolationMethod}
            onClose={() => setIsResizeOpen(false)}
            onApply={onResizeApply}
          />
        )}

        {isKernelFilterOpen && originalImageData && (
          <KernelFilterDialog
            open={isKernelFilterOpen}
            imageInfo={imageInfo}
            currentSettings={kernelFilterSettings}
            onPreviewChange={setKernelFilterSettings}
            onApply={onKernelFilterApply}
            onClose={() => setIsKernelFilterOpen(false)}
          />
        )}

      </Box>
    </ThemeProvider>
  );
}

export default App;
