import React, { useRef, useEffect, memo } from 'react';
import { Box, CircularProgress, Typography, Stack, Chip } from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import ColorizeIcon from '@mui/icons-material/Colorize';

interface ImageCanvasProps {
  imageData: ImageData | null;
  onPixelClick?: (x: number, y: number) => void;
  isEyedropperActive: boolean;
  isProcessing?: boolean;
}

export const ImageCanvas = memo(({ 
  imageData, 
  onPixelClick, 
  isEyedropperActive, 
  isProcessing 
}: ImageCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    // Only update dimensions if they changed to avoid clearing the canvas unnecessarily
    if (canvas.width !== imageData.width || canvas.height !== imageData.height) {
      canvas.width = imageData.width;
      canvas.height = imageData.height;
    }
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
    }
  }, [imageData]);

  const handleMouseClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive || !onPixelClick || !canvasRef.current || !imageData) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      onPixelClick(x, y);
    }
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      overflow: 'auto', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      bgcolor: '#111216',
      backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
      p: { xs: 1.5, md: 3 },
      cursor: isEyedropperActive ? 'crosshair' : 'default',
      position: 'relative'
    }}>
      {!imageData && (
        <Stack
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 'min(520px, 100%)',
            minHeight: 300,
            border: '1px dashed',
            borderColor: 'rgba(255,255,255,0.18)',
            borderRadius: 2,
            bgcolor: 'rgba(27,29,34,0.72)',
            color: 'text.secondary',
            px: 3,
            textAlign: 'center',
          }}
        >
          <Box sx={{
            width: 72,
            height: 72,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(46,211,183,0.1)',
            color: 'primary.main',
            border: '1px solid rgba(46,211,183,0.25)',
          }}>
            <ImageOutlinedIcon sx={{ fontSize: 36 }} />
          </Box>
          <Box>
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 800 }}>
              Откройте изображение
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PNG, JPG или GB7
            </Typography>
          </Box>
        </Stack>
      )}

      {isProcessing && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'rgba(17,18,22,0.42)',
          backdropFilter: 'blur(2px)',
        }}>
          <Stack spacing={1} sx={{ alignItems: 'center' }}>
            <CircularProgress size={34} />
            <Typography variant="caption" color="text.secondary">Обработка</Typography>
          </Stack>
        </Box>
      )}

      {imageData && (
        <Box sx={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
          <canvas 
            ref={canvasRef} 
            onClick={handleMouseClick}
            style={{ 
              display: 'block',
              boxShadow: '0 22px 55px rgba(0,0,0,0.42)',
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 150px)',
              objectFit: 'contain',
              opacity: isProcessing ? 0.78 : 1,
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 6,
              backgroundColor: '#2d3036',
              backgroundImage: 'linear-gradient(45deg, #25272d 25%, transparent 25%), linear-gradient(-45deg, #25272d 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #25272d 75%), linear-gradient(-45deg, transparent 75%, #25272d 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }} 
          />

          <Stack direction="row" spacing={1} sx={{ position: 'absolute', left: 10, bottom: 10 }}>
            <Chip
              size="small"
              label={`${imageData.width}×${imageData.height}`}
              sx={{ bgcolor: 'rgba(17,18,22,0.82)', border: '1px solid rgba(255,255,255,0.14)' }}
            />
            {isEyedropperActive && (
              <Chip
                size="small"
                icon={<ColorizeIcon />}
                label="Пипетка"
                color="primary"
                variant="outlined"
                sx={{ bgcolor: 'rgba(17,18,22,0.82)' }}
              />
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
});
