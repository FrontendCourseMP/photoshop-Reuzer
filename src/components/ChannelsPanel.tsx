import { useEffect, useMemo, useRef, memo } from 'react';
import { Box, Typography, Paper, Checkbox, Stack, ButtonBase, Divider, Chip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { ChannelState } from '../hooks/useImageProcessor';
import type { ImageInfo } from '../types/image';

interface ChannelsPanelProps {
  imageData: ImageData | null;
  imageInfo: ImageInfo;
  channels: ChannelState;
  onToggle: (channel: keyof ChannelState) => void;
  onChange: (channels: ChannelState) => void;
}

type ChannelPreview = 'gray' | keyof ChannelState;

interface ChannelItem {
  id: string;
  label: string;
  description: string;
  color: string;
  preview: ChannelPreview;
  keys: Array<keyof ChannelState>;
}

const ChannelThumbnail = memo(({
  imageData,
  preview,
  active,
}: {
  imageData: ImageData;
  preview: ChannelPreview;
  active: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const thumbWidth = 60;
    const thumbHeight = Math.max(1, Math.round((imageData.height / imageData.width) * thumbWidth));
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = imageData.width;
    offCanvas.height = imageData.height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offCanvas, 0, 0, thumbWidth, thumbHeight);

    const thumbData = ctx.getImageData(0, 0, thumbWidth, thumbHeight);
    for (let i = 0; i < thumbData.data.length; i += 4) {
      const r = thumbData.data[i];
      const g = thumbData.data[i + 1];
      const b = thumbData.data[i + 2];
      const a = thumbData.data[i + 3];
      const value = getPreviewValue(preview, r, g, b, a);

      thumbData.data[i] = value;
      thumbData.data[i + 1] = value;
      thumbData.data[i + 2] = value;
      thumbData.data[i + 3] = 255;
    }
    ctx.putImageData(thumbData, 0, 0);
  }, [imageData, preview]);

  return (
    <Box sx={{
      border: active ? '2px solid #2ed3b7' : '2px solid transparent',
      borderRadius: 1,
      overflow: 'hidden',
      width: 60,
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#000',
      opacity: active ? 1 : 0.5,
      transition: 'opacity 120ms ease, border-color 120ms ease',
    }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
    </Box>
  );
});

export const ChannelsPanel = memo(({
  imageData,
  imageInfo,
  channels,
  onToggle,
  onChange,
}: ChannelsPanelProps) => {
  const channelList = useMemo(() => buildChannelList(imageInfo), [imageInfo]);

  const toggleItem = (item: ChannelItem) => {
    if (item.keys.length === 1) {
      onToggle(item.keys[0]);
      return;
    }

    const isActive = item.keys.every(key => channels[key]);
    const nextChannels = { ...channels };
    item.keys.forEach(key => {
      nextChannels[key] = !isActive;
    });

    if (!imageInfo.hasAlpha) {
      nextChannels.a = false;
    }

    onChange(nextChannels);
  };

  return (
    <Paper
      square
      elevation={0}
      sx={{
        p: 2,
        bgcolor: '#181a1f',
        borderRight: { md: '1px solid' },
        borderBottom: { xs: '1px solid', md: 'none' },
        borderColor: 'divider',
        minHeight: 0,
        overflow: 'auto',
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Stack spacing={0.75} sx={{ mb: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          Панель
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Каналы
          </Typography>
          {imageInfo.colorModel !== 'none' && (
            <Chip size="small" label={getColorModelLabel(imageInfo)} sx={{ height: 22 }} />
          )}
        </Stack>
      </Stack>

      {!imageData ? (
        <Box sx={{
          border: '1px dashed',
          borderColor: 'rgba(255,255,255,0.14)',
          borderRadius: 1,
          p: 2,
          color: 'text.secondary',
          bgcolor: 'rgba(255,255,255,0.02)',
        }}>
          <Typography variant="body2">Нет активного изображения</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {channelList.map(item => {
            const active = item.keys.every(key => channels[key]);

            return (
              <ButtonBase
                key={item.id}
                onClick={() => toggleItem(item)}
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  border: '1px solid',
                  borderColor: active ? 'rgba(46,211,183,0.35)' : 'divider',
                  borderRadius: 1,
                  bgcolor: active ? 'rgba(46,211,183,0.07)' : 'rgba(255,255,255,0.02)',
                  p: 1,
                  textAlign: 'left',
                  transition: 'border-color 120ms ease, background-color 120ms ease',
                  '&:hover': {
                    bgcolor: active ? 'rgba(46,211,183,0.1)' : 'rgba(255,255,255,0.045)',
                  },
                }}
              >
                <ChannelThumbnail imageData={imageData} preview={item.preview} active={active} />
                <Box sx={{ minWidth: 0, flexGrow: 1, ml: 1.25 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: item.color,
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                </Box>
                <Stack spacing={0.25} sx={{ alignItems: 'center' }}>
                  {active ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" color="disabled" />}
                  <Checkbox size="small" checked={active} readOnly sx={{ p: 0 }} />
                </Stack>
              </ButtonBase>
            );
          })}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        Превью RGB-каналов показаны в градациях серого по интенсивности. Альфа отображается как черно-белая маска.
      </Typography>
    </Paper>
  );
});

const buildChannelList = (imageInfo: ImageInfo): ChannelItem[] => {
  if (imageInfo.colorModel === 'none') return [];

  if (imageInfo.isGrayscale) {
    const channels: ChannelItem[] = [
      {
        id: 'gray',
        label: 'Яркость',
        description: 'Канал оттенков серого',
        color: '#d5d9df',
        preview: 'gray',
        keys: ['r', 'g', 'b'],
      },
    ];

    if (imageInfo.hasAlpha) {
      channels.push({
        id: 'alpha',
        label: imageInfo.hasMask ? 'Маска' : 'Альфа',
        description: 'Прозрачность изображения',
        color: '#f2b84b',
        preview: 'a',
        keys: ['a'],
      });
    }

    return channels;
  }

  const channels: ChannelItem[] = [
    {
      id: 'r',
      label: 'Красный',
      description: 'Красная составляющая',
      color: '#ff6b6b',
      preview: 'r',
      keys: ['r'],
    },
    {
      id: 'g',
      label: 'Зеленый',
      description: 'Зеленая составляющая',
      color: '#4ddf86',
      preview: 'g',
      keys: ['g'],
    },
    {
      id: 'b',
      label: 'Синий',
      description: 'Синяя составляющая',
      color: '#65a9ff',
      preview: 'b',
      keys: ['b'],
    },
  ];

  if (imageInfo.hasAlpha) {
    channels.push({
      id: 'a',
      label: 'Альфа',
      description: 'Прозрачность изображения',
      color: '#f2b84b',
      preview: 'a',
      keys: ['a'],
    });
  }

  return channels;
};

const getPreviewValue = (
  preview: ChannelPreview,
  r: number,
  g: number,
  b: number,
  a: number
) => {
  if (preview === 'r') return r;
  if (preview === 'g') return g;
  if (preview === 'b') return b;
  if (preview === 'a') return a;

  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
};

const getColorModelLabel = (imageInfo: ImageInfo) => {
  if (imageInfo.colorModel === 'grayscale') return 'Grayscale';
  if (imageInfo.colorModel === 'grayscale-alpha') {
    return imageInfo.hasMask ? 'Grayscale + mask' : 'Grayscale + alpha';
  }
  if (imageInfo.colorModel === 'rgb') return 'RGB';
  if (imageInfo.colorModel === 'rgba') return 'RGB + alpha';

  return 'Нет файла';
};
