import { useState, useCallback, memo } from 'react';
import type { ChangeEvent } from 'react';
import { 
  Box, CssBaseline, ThemeProvider, createTheme 
} from '@mui/material';
import { useImageProcessor } from './hooks/useImageProcessor';
import { ToolBar } from './components/ToolBar';
import { ImageCanvas } from './components/ImageCanvas';
import { ChannelsPanel } from './components/ChannelsPanel';
import { InfoPanel } from './components/InfoPanel';
import { LevelsDialog } from './components/LevelsDialog';
import { handleImageFile, downloadImage } from './utils/fileHandler';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#1e1e1e', paper: '#252526' }
  },
});

const MemoizedInfoPanel = memo(InfoPanel);

function App() {
  const { 
    originalImageData, 
    setOriginalImageData, 
    displayImageData, 
    channels, 
    toggleChannel,
    levelsSettings,
    setLevelsSettings,
    histograms,
    isProcessing
  } = useImageProcessor();

  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0, depth: 0 });
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [isLevelsOpen, setIsLevelsOpen] = useState(false);
  const [pickedPixel, setPickedPixel] = useState<{ x: number, y: number, r: number, g: number, b: number, a: number } | null>(null);

  const onFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleImageFile(
      file,
      (imageData, depth) => {
        setOriginalImageData(imageData);
        setImageInfo({ width: imageData.width, height: imageData.height, depth });
        setPickedPixel(null);
      },
      (error) => alert(error)
    );
    event.target.value = '';
  }, [setOriginalImageData]);

  const onDownload = useCallback((format: 'png' | 'jpg' | 'gb7') => {
    if (displayImageData) {
      downloadImage(displayImageData, format);
    }
  }, [displayImageData]);

  const onPixelClick = useCallback((x: number, y: number) => {
    if (!originalImageData) return;
    const index = (y * originalImageData.width + x) * 4;
    const r = originalImageData.data[index];
    const g = originalImageData.data[index + 1];
    const b = originalImageData.data[index + 2];
    const a = originalImageData.data[index + 3];
    setPickedPixel({ x, y, r, g, b, a });
  }, [originalImageData]);

  const toggleEyedropper = useCallback(() => {
    setIsEyedropperActive(prev => !prev);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        <ToolBar 
          onFileUpload={onFileUpload}
          onDownload={onDownload}
          isEyedropperActive={isEyedropperActive}
          onToggleEyedropper={toggleEyedropper}
          onOpenLevels={() => setIsLevelsOpen(true)}
          hasImage={!!originalImageData}
        />

        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          <ChannelsPanel 
            imageData={originalImageData}
            channels={channels}
            onToggle={toggleChannel}
          />

          <ImageCanvas 
            imageData={displayImageData}
            isEyedropperActive={isEyedropperActive}
            onPixelClick={onPixelClick}
            isProcessing={isProcessing}
          />

          <MemoizedInfoPanel 
            imageInfo={imageInfo}
            pickedPixel={pickedPixel}
          />
        </Box>

        <LevelsDialog 
          open={isLevelsOpen}
          onClose={() => setIsLevelsOpen(false)}
          onApply={setLevelsSettings}
          currentSettings={levelsSettings}
          histograms={histograms}
        />

      </Box>
    </ThemeProvider>
  );
}

export default App;
