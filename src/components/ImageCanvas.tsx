import React, { useRef, useEffect, memo } from 'react';
import { Box, CircularProgress } from '@mui/material';

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
      bgcolor: '#1e1e1e',
      p: 2,
      cursor: isEyedropperActive ? 'crosshair' : 'default',
      position: 'relative'
    }}>
      {isProcessing && (
        <CircularProgress 
          sx={{ position: 'absolute', zIndex: 10 }} 
        />
      )}
      <canvas 
        ref={canvasRef} 
        onClick={handleMouseClick}
        style={{ 
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          opacity: isProcessing ? 0.7 : 1,
          background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYNgRwEg9AMw4+nAwMDIyMSiE0DSyAEYmBqUQTKqGURtGbRhRBxAaARAA/6AOBf0nOq0AAAAASUVORK5CYII=) repeat'
        }} 
      />
    </Box>
  );
});
