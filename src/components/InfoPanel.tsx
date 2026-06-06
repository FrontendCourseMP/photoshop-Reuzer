import React from 'react';
import { Box, Typography, Paper, Divider, Stack, Chip, Slider } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StraightenIcon from '@mui/icons-material/Straighten';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import { rgbToLab } from '../utils/colorSpace';
import type { ImageInfo } from '../types/image';
import {
  INTERPOLATION_OPTIONS,
  MAX_VIEW_SCALE,
  MIN_VIEW_SCALE,
  type InterpolationMethod,
} from '../utils/interpolation';

interface InfoPanelProps {
  imageInfo: ImageInfo;
  pickedPixel: { x: number; y: number; r: number; g: number; b: number; a: number } | null;
  viewScalePercent: number;
  onViewScaleChange: (scale: number) => void;
  interpolationMethod: InterpolationMethod;
  onInterpolationMethodChange: (method: InterpolationMethod) => void;
}

const PRESET_SCALES = [12, 25, 50, 75, 100, 150, 200, 300];

export const InfoPanel: React.FC<InfoPanelProps> = ({
  imageInfo,
  pickedPixel,
  viewScalePercent,
  onViewScaleChange,
  interpolationMethod,
  onInterpolationMethodChange,
}) => {
  const lab = pickedPixel ? rgbToLab({ r: pickedPixel.r, g: pickedPixel.g, b: pickedPixel.b }) : null;
  const hasImage = imageInfo.width > 0 && imageInfo.height > 0;

  return (
    <Paper 
      square
      elevation={0}
      sx={{ 
        p: 2,
        bgcolor: '#181a1f',
        borderLeft: { md: '1px solid' },
        borderTop: { xs: '1px solid', md: 'none' },
        borderColor: 'divider',
        minHeight: 0,
        overflow: 'auto',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <InfoOutlinedIcon fontSize="small" color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Инфо</Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.025)', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <StraightenIcon fontSize="small" color="secondary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Изображение</Typography>
        </Stack>
        {hasImage ? (
          <Stack spacing={1}>
            <InfoRow label="Ширина" value={`${imageInfo.width}px`} />
            <InfoRow label="Высота" value={`${imageInfo.height}px`} />
            <InfoRow label="Глубина" value={imageInfo.depthLabel} />
            <InfoRow label="Формат" value={imageInfo.format} />
            {imageInfo.hasMask && <InfoRow label="Маска" value="есть" />}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">Нет активного изображения</Typography>
        )}
      </Paper>
      
      <Divider />

      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.025)', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Масштаб</Typography>
          <Chip size="small" label={`${viewScalePercent}%`} />
        </Stack>

        <Slider
          value={viewScalePercent}
          min={MIN_VIEW_SCALE}
          max={MAX_VIEW_SCALE}
          disabled={!hasImage}
          onChange={(_, value) => {
            if (typeof value === 'number') onViewScaleChange(value);
          }}
          sx={{ mb: 1 }}
        />

        <Stack direction="row" spacing={1}>
          <Box
            component="select"
            value={PRESET_SCALES.includes(viewScalePercent) ? String(viewScalePercent) : 'custom'}
            disabled={!hasImage}
            onChange={(event) => {
              if (event.target.value !== 'custom') onViewScaleChange(Number(event.target.value));
            }}
            sx={{
              width: '50%',
              height: 32,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#202329',
              color: 'text.primary',
              px: 1,
            }}
          >
            <option value="custom">Свое</option>
            {PRESET_SCALES.map(scale => (
              <option key={scale} value={scale}>{scale}%</option>
            ))}
          </Box>

          <Box
            component="select"
            value={interpolationMethod}
            disabled={!hasImage}
            onChange={(event) => onInterpolationMethodChange(event.target.value as InterpolationMethod)}
            sx={{
              width: '50%',
              height: 32,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#202329',
              color: 'text.primary',
              px: 1,
            }}
          >
            {INTERPOLATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Box>
        </Stack>
      </Paper>

      <Divider />
      
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.025)', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.25 }}>
          <PaletteOutlinedIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Пипетка</Typography>
        </Stack>

        {pickedPixel ? (
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box sx={{
                width: 46,
                height: 46,
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.28)',
                bgcolor: `rgb(${pickedPixel.r},${pickedPixel.g},${pickedPixel.b})`,
              }} />
              <Stack spacing={0.5}>
                <Chip size="small" label={`X ${pickedPixel.x}`} />
                <Chip size="small" label={`Y ${pickedPixel.y}`} />
              </Stack>
            </Stack>

            <Stack spacing={1}>
              <InfoRow label="R" value={pickedPixel.r} tone="#ff6b6b" />
              <InfoRow label="G" value={pickedPixel.g} tone="#4ddf86" />
              <InfoRow label="B" value={pickedPixel.b} tone="#65a9ff" />
              <InfoRow label="Alpha" value={pickedPixel.a} tone="#f2b84b" />
            </Stack>

            {lab && (
              <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  CIELAB
                </Typography>
                <Stack direction="row" spacing={0.75}>
                  <Chip size="small" label={`L ${lab.l.toFixed(1)}`} />
                  <Chip size="small" label={`a ${lab.a.toFixed(1)}`} />
                  <Chip size="small" label={`b ${lab.b.toFixed(1)}`} />
                </Stack>
              </Box>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Выберите пипетку и кликните по пикселю
          </Typography>
        )}
      </Paper>
    </Paper>
  );
};

const InfoRow = ({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      {tone && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tone }} />}
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Stack>
    <Typography variant="caption" sx={{ fontFamily: 'ui-monospace, Consolas, monospace', color: 'text.primary' }}>
      {value}
    </Typography>
  </Stack>
);
