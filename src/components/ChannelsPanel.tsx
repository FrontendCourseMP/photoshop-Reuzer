import { useEffect, useRef, memo } from 'react';
import { Box, Typography, Paper, Checkbox } from '@mui/material';
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
  if (!imageData) return null;

  const channelList: { key: keyof ChannelState; label: string; desc: string }[] = [
    { key: 'r', label: 'Красный', desc: '1 (grayscale)' },
    { key: 'g', label: 'Зеленый', desc: '2 (grayscale + alpha)' },
    { key: 'b', label: 'Синий', desc: '3 (RGB)' },
    { key: 'a', label: 'Альфа', desc: '4 (RGB + alpha)' },
  ];

  return (
    <Paper sx={{ p: 2, bgcolor: 'background.paper', width: 250 }}>
      <Typography variant="h6" gutterBottom>Каналы</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {channelList.map(({ key, label, desc }) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => onToggle(key)}>
            <ChannelThumbnail imageData={imageData} channel={key} active={channels[key]} />
            <Box>
              <Typography variant="body2">{label}</Typography>
              <Typography variant="caption" color="text.secondary">{desc}</Typography>
              <Checkbox size="small" checked={channels[key]} readOnly sx={{ p: 0, ml: 1 }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
});
