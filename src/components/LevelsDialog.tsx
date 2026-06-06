import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Slider,
  IconButton,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Stack,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { FilterSettings, HistogramData, LevelsSettings } from '../hooks/useImageProcessor';
import { INITIAL_LEVELS } from '../hooks/useImageProcessor';

interface LevelsDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (settings: FilterSettings) => void;
  currentSettings: FilterSettings;
  histograms: HistogramData | null;
}

const CHANNELS: { key: keyof FilterSettings; label: string; color: string }[] = [
  { key: 'master', label: 'RGB', color: '#f4f6f8' },
  { key: 'r', label: 'R', color: '#ff6b6b' },
  { key: 'g', label: 'G', color: '#4ddf86' },
  { key: 'b', label: 'B', color: '#65a9ff' },
  { key: 'a', label: 'A', color: '#f2b84b' },
];

export const LevelsDialog: React.FC<LevelsDialogProps> = ({
  open,
  onClose,
  onApply,
  currentSettings,
  histograms,
}) => {
  const initialSettingsRef = useRef<FilterSettings>(currentSettings);
  const isFirstOpenRef = useRef(true);
  const [localSettings, setLocalSettings] = useState<FilterSettings>(currentSettings);
  const [selectedChannel, setSelectedChannel] = useState<keyof FilterSettings>('master');
  const [isPreviewEnabled, setIsPreviewEnabled] = useState(true);
  const [isLogScale, setIsLogScale] = useState(false);

  useEffect(() => {
    if (open && isFirstOpenRef.current) {
      initialSettingsRef.current = currentSettings;
      setLocalSettings(currentSettings);
      isFirstOpenRef.current = false;
    }

    if (!open) {
      isFirstOpenRef.current = true;
    }
  }, [open, currentSettings]);

  useEffect(() => {
    if (open && isPreviewEnabled) {
      onApply(localSettings);
    }
  }, [localSettings, isPreviewEnabled, onApply, open]);

  const handleReset = () => {
    setLocalSettings(prev => ({
      ...prev,
      [selectedChannel]: { ...INITIAL_LEVELS },
    }));
  };

  const handleApply = () => {
    onApply(localSettings);
    onClose();
  };

  const handleCancel = () => {
    onApply(initialSettingsRef.current);
    onClose();
  };

  const updateChannelSetting = (key: keyof LevelsSettings, value: number) => {
    setLocalSettings(prev => {
      const current = prev[selectedChannel];
      if (key === 'black' && value >= current.white) return prev;
      if (key === 'white' && value <= current.black) return prev;

      return {
        ...prev,
        [selectedChannel]: { ...current, [key]: value },
      };
    });
  };

  const handleRangeChange = (_: Event, val: number | number[]) => {
    if (!Array.isArray(val)) return;
    const [black, white] = val;
    setLocalSettings(prev => ({
      ...prev,
      [selectedChannel]: { ...prev[selectedChannel], black, white },
    }));
  };

  const histogramData = useMemo(() => {
    if (!histograms || !histograms[selectedChannel]) return [];

    const data = histograms[selectedChannel];
    const max = Math.max(...data);
    if (max <= 0) return Array.from(data).map(() => 0);

    return Array.from(data).map((value) => {
      if (isLogScale) {
        return Math.log(value + 1) / Math.log(max + 1);
      }

      return value / max;
    });
  }, [histograms, selectedChannel, isLogScale]);

  const currentChannelSettings = localSettings[selectedChannel];
  const activeChannel = CHANNELS.find(channel => channel.key === selectedChannel) ?? CHANNELS[0];

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#1b1d22',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 28px 80px rgba(0,0,0,0.55)',
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 2.25, pb: 1.25 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              Уровни
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Входной диапазон и гамма
            </Typography>
          </Box>
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 2.25, pb: 1.5 }}>
        <Tabs
          value={selectedChannel}
          onChange={(_, value) => setSelectedChannel(value as keyof FilterSettings)}
          variant="fullWidth"
          sx={{
            minHeight: 38,
            mb: 2,
            '& .MuiTab-root': {
              minHeight: 38,
              fontWeight: 800,
            },
          }}
        >
          {CHANNELS.map(channel => (
            <Tab
              key={channel.key}
              value={channel.key}
              label={channel.label}
              sx={{
                color: channel.key === selectedChannel ? channel.color : undefined,
              }}
            />
          ))}
        </Tabs>

        <Paper
          variant="outlined"
          sx={{
            bgcolor: '#0f1013',
            borderColor: 'divider',
            height: 188,
            mb: 1.5,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 256 100">
            {histogramData.map((value, index) => (
              <line
                key={index}
                x1={index}
                y1="100"
                x2={index}
                y2={100 - value * 100}
                stroke={activeChannel.color}
                strokeWidth="1"
                opacity="0.86"
              />
            ))}
          </svg>
        </Paper>

        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <FormControlLabel
            control={<Checkbox size="small" checked={isLogScale} onChange={e => setIsLogScale(e.target.checked)} />}
            label={<Typography variant="caption">Логарифмическая шкала</Typography>}
          />
          <Stack direction="row" spacing={0.75}>
            <Chip size="small" label={`Black ${currentChannelSettings.black}`} />
            <Chip size="small" label={`γ ${currentChannelSettings.gamma.toFixed(1)}`} />
            <Chip size="small" label={`White ${currentChannelSettings.white}`} />
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ px: 1, pb: 1 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Входные уровни
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentChannelSettings.black} / {currentChannelSettings.gamma.toFixed(2)} / {currentChannelSettings.white}
            </Typography>
          </Stack>

          <Slider
            value={[currentChannelSettings.black, currentChannelSettings.white]}
            onChange={handleRangeChange}
            min={0}
            max={255}
            disableSwap
            sx={{
              mb: 2.5,
              color: activeChannel.key === 'master' ? 'primary.main' : activeChannel.color,
            }}
          />

          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Гамма
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Нелинейная коррекция
            </Typography>
          </Stack>
          <Slider
            value={currentChannelSettings.gamma}
            onChange={(_, value) => {
              if (typeof value === 'number') updateChannelSetting('gamma', value);
            }}
            min={0.1}
            max={9.9}
            step={0.1}
            sx={{
              color: activeChannel.key === 'master' ? 'primary.main' : activeChannel.color,
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.25, py: 2, justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider' }}>
        <FormControlLabel
          control={<Checkbox checked={isPreviewEnabled} onChange={e => setIsPreviewEnabled(e.target.checked)} />}
          label="Предпросмотр"
        />
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RestartAltIcon />} variant="text" onClick={handleReset}>
            Сброс
          </Button>
          <Button variant="outlined" onClick={handleCancel}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleApply}>
            Применить
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
