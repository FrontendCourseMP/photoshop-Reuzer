import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { rgbToLab } from '../utils/colorSpace';

interface InfoPanelProps {
  imageInfo: { width: number; height: number; depth: number };
  pickedPixel: { x: number; y: number; r: number; g: number; b: number; a: number } | null;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ imageInfo, pickedPixel }) => {
  const lab = pickedPixel ? rgbToLab({ r: pickedPixel.r, g: pickedPixel.g, b: pickedPixel.b }) : null;

  return (
    <Paper sx={{ p: 2, bgcolor: 'background.paper', width: 250, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="h6">Инфо</Typography>
      <Typography variant="caption">Ширина: {imageInfo.width}px</Typography>
      <Typography variant="caption">Высота: {imageInfo.height}px</Typography>
      <Typography variant="caption">Глубина: {imageInfo.depth} bit</Typography>
      
      <Divider sx={{ my: 1 }} />
      
      <Typography variant="subtitle2">Пипетка:</Typography>
      {pickedPixel ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption">X: {pickedPixel.x}, Y: {pickedPixel.y}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: `rgba(${pickedPixel.r},${pickedPixel.g},${pickedPixel.b},${pickedPixel.a / 255})`, border: '1px solid #fff' }} />
            <Typography variant="caption">RGB: {pickedPixel.r}, {pickedPixel.g}, {pickedPixel.b}</Typography>
          </Box>
          <Typography variant="caption">Alpha: {pickedPixel.a}</Typography>
          {lab && (
            <Typography variant="caption">
              CIELAB: L={lab.l.toFixed(1)} a={lab.a.toFixed(1)} b={lab.b.toFixed(1)}
            </Typography>
          )}
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">Кликните по изображению</Typography>
      )}
    </Paper>
  );
};
