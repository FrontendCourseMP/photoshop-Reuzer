import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Button, Typography, Checkbox, FormControlLabel, Slider, IconButton, Paper, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { FilterSettings, HistogramData, LevelsSettings } from '../hooks/useImageProcessor';
import { INITIAL_LEVELS } from '../hooks/useImageProcessor';

interface LevelsDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (settings: FilterSettings) => void;
  currentSettings: FilterSettings;
  histograms: HistogramData | null;
}

export const LevelsDialog: React.FC<LevelsDialogProps> = ({ 
  open, onClose, onApply, currentSettings, histograms 
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initialSettingsRef = useRef<FilterSettings>(currentSettings);
  const [localSettings, setLocalSettings] = useState<FilterSettings>(currentSettings);
  const [selectedChannel, setSelectedChannel] = useState<keyof FilterSettings>('master');
  const [isPreviewEnabled, setIsPreviewEnabled] = useState(true);
  const [isLogScale, setIsLogScale] = useState(false);
  const isFirstOpenRef = useRef(true);

  useEffect(() => {
    if (open) {
      if (isFirstOpenRef.current) {
        initialSettingsRef.current = currentSettings;
        setLocalSettings(currentSettings);
        isFirstOpenRef.current = false;
      }
      dialogRef.current?.showModal();
    } else {
      isFirstOpenRef.current = true;
      dialogRef.current?.close();
    }
  }, [open, currentSettings]);

  // Real-time preview logic: we call onApply directly to update parent's levelsSettings
  useEffect(() => {
    if (open && isPreviewEnabled) {
      onApply(localSettings);
    }
  }, [localSettings, isPreviewEnabled, onApply, open]);

  const handleReset = () => {
    setLocalSettings(prev => ({
      ...prev,
      [selectedChannel]: { ...INITIAL_LEVELS }
    }));
  };

  const handleApply = () => {
    onApply(localSettings);
    onClose();
  };

  const handleCancel = () => {
    onApply(initialSettingsRef.current); // Restore original
    onClose();
  };

  const updateChannelSetting = (key: keyof LevelsSettings, value: number) => {
    setLocalSettings(prev => {
        const current = prev[selectedChannel];
        // Prevent black from exceeding white and vice versa
        if (key === 'black' && value >= current.white) return prev;
        if (key === 'white' && value <= current.black) return prev;
        
        return {
            ...prev,
            [selectedChannel]: { ...current, [key]: value }
        };
    });
  };

  // Use a dedicated handler for the range slider to avoid multiple state updates
  const handleRangeChange = (_: Event, val: number | number[]) => {
    if (!Array.isArray(val)) return;
    const [b, w] = val;
    setLocalSettings(prev => ({
        ...prev,
        [selectedChannel]: { ...prev[selectedChannel], black: b, white: w }
    }));
  };

  // Pre-calculate histogram points for SVG
  const histogramData = useMemo(() => {
    if (!histograms || !histograms[selectedChannel]) return [];
    const data = histograms[selectedChannel];
    const max = Math.max(...data);
    return Array.from(data).map((val) => {
        if (isLogScale) {
            return val > 0 ? Math.log(val) / Math.log(max) : 0;
        }
        return val / max;
    });
  }, [histograms, selectedChannel, isLogScale]);

  if (!open) return null;

  const currentChannelSettings = localSettings[selectedChannel];

  return (
    <dialog 
      ref={dialogRef} 
      onClose={handleCancel}
      style={{
        padding: 0,
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#252526',
        color: '#fff',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        width: '600px'
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Уровни</Typography>
          <IconButton onClick={handleCancel} size="small" sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Use native select for better compatibility with native <dialog> */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Канал:</Typography>
          <select 
            value={selectedChannel} 
            onChange={(e) => setSelectedChannel(e.target.value as keyof FilterSettings)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          >
            <option value="master">RGB (Master)</option>
            <option value="r">Красный</option>
            <option value="g">Зеленый</option>
            <option value="b">Синий</option>
            <option value="a">Альфа</option>
          </select>
        </Box>

        {/* Histogram Area */}
        <Paper variant="outlined" sx={{ bgcolor: '#000', height: 180, mb: 1, position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 256 100">
                {histogramData.map((h, i) => (
                    <line key={i} x1={i} y1="100" x2={i} y2={100 - (h * 100)} stroke="#ccc" strokeWidth="1" />
                ))}
            </svg>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <FormControlLabel 
                control={<Checkbox size="small" checked={isLogScale} onChange={e => setIsLogScale(e.target.checked)} />} 
                label={<Typography variant="caption">Логарифмическая шкала</Typography>} 
            />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Input Levels Sliders */}
        <Box sx={{ px: 2, mb: 4 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              Входные уровни: <b>{currentChannelSettings.black}</b> / <b>{currentChannelSettings.gamma.toFixed(2)}</b> / <b>{currentChannelSettings.white}</b>
            </Typography>
            
            <Slider
                value={[currentChannelSettings.black, currentChannelSettings.white]}
                onChange={handleRangeChange}
                min={0}
                max={255}
                disableSwap
                sx={{ mb: 2 }}
            />
            
            <Typography variant="caption" sx={{ display: 'block' }}>Гамма (нелинейная коррекция)</Typography>
            <Slider
                value={currentChannelSettings.gamma}
                onChange={(_, val) => {
                  if (typeof val === 'number') updateChannelSetting('gamma', val);
                }}
                min={0.1}
                max={9.9}
                step={0.1}
            />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel 
                control={<Checkbox checked={isPreviewEnabled} onChange={e => setIsPreviewEnabled(e.target.checked)} />} 
                label="Предпросмотр" 
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="text" size="small" onClick={handleReset}>Сброс</Button>
                <Button variant="outlined" size="small" onClick={handleCancel}>Отмена</Button>
                <Button variant="contained" size="small" onClick={handleApply}>Применить</Button>
            </Box>
        </Box>
      </Box>
    </dialog>
  );
};

