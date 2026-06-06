import { useEffect, useRef, memo } from 'react';
import { Box, Typography, Paper, Checkbox, Stack, ButtonBase, Divider } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { ChannelState } from '../hooks/useImageProcessor';

interface ChannelsPanelProps {
  imageData: ImageData | null;
  channels: ChannelState;
  onToggle: (channel: keyof ChannelState) => void;
}

const ChannelThumbnail = memo(({ 
  imageData, 
  channel, 
  active 
}: { 
  imageData: ImageData; 
  channel: keyof ChannelState; 
  active: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const thumbWidth = 60;
    const thumbHeight = (imageData.height / imageData.width) * thumbWidth;
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;

    // Faster approach: Use an offscreen canvas to scale and extract channel
    const offCanvas = document.createElement('canvas');
    offCanvas.width = imageData.width;
    offCanvas.height = imageData.height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.putImageData(imageData, 0, 0);

    // Extract channel using composite operations or simple draw if we just want grayscale
    // Actually, simple way is drawImage to scale, then loop over the small result
    ctx.drawImage(offCanvas, 0, 0, thumbWidth, thumbHeight);
    
    const thumbData = ctx.getImageData(0, 0, thumbWidth, thumbHeight);
    for (let i = 0; i < thumbData.data.length; i += 4) {
      let val = 0;
      if (channel === 'r') val = thumbData.data[i];
      else if (channel === 'g') val = thumbData.data[i + 1];
      else if (channel === 'b') val = thumbData.data[i + 2];
      else if (channel === 'a') val = thumbData.data[i + 3];

      thumbData.data[i] = val;
      thumbData.data[i + 1] = val;
      thumbData.data[i + 2] = val;
      thumbData.data[i + 3] = 255;
    }
    ctx.putImageData(thumbData, 0, 0);
  }, [imageData, channel]);

  return (
    <Box sx={{ 
      border: active ? '2px solid #1976d2' : '2px solid transparent',
      borderRadius: 1,
      overflow: 'hidden',
      width: 60,
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#000'
    }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
    </Box>
  );
});

export const ChannelsPanel = memo(({ imageData, channels, onToggle }: ChannelsPanelProps) => {
  const channelList: { key: keyof ChannelState; label: string; desc: string; color: string }[] = [
    { key: 'r', label: 'Красный', desc: 'Red', color: '#ff6b6b' },
    { key: 'g', label: 'Зеленый', desc: 'Green', color: '#4ddf86' },
    { key: 'b', label: 'Синий', desc: 'Blue', color: '#65a9ff' },
    { key: 'a', label: 'Альфа', desc: 'Opacity', color: '#f2b84b' },
  ];

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
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          Панель
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Каналы
        </Typography>
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
        {channelList.map(({ key, label, desc, color }) => (
          <ButtonBase
            key={key}
            onClick={() => onToggle(key)}
            sx={{ 
              width: '100%',
              justifyContent: 'flex-start',
              border: '1px solid',
              borderColor: channels[key] ? 'rgba(46,211,183,0.35)' : 'divider',
              borderRadius: 1,
              bgcolor: channels[key] ? 'rgba(46,211,183,0.07)' : 'rgba(255,255,255,0.02)',
              p: 1,
              textAlign: 'left',
              transition: 'border-color 120ms ease, background-color 120ms ease',
              '&:hover': {
                bgcolor: channels[key] ? 'rgba(46,211,183,0.1)' : 'rgba(255,255,255,0.045)',
              },
            }}
          >
            <ChannelThumbnail imageData={imageData} channel={key} active={channels[key]} />
            <Box sx={{ minWidth: 0, flexGrow: 1, ml: 1.25 }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: color,
                }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">{desc}</Typography>
            </Box>
            <Stack spacing={0.25} sx={{ alignItems: 'center' }}>
              {channels[key] ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" color="disabled" />}
              <Checkbox size="small" checked={channels[key]} readOnly sx={{ p: 0 }} />
            </Stack>
          </ButtonBase>
        ))}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        Отключенные RGB-каналы зануляются, отключенная альфа становится непрозрачной.
      </Typography>
    </Paper>
  );
});
