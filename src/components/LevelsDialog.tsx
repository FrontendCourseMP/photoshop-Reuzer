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
  Stack,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { FilterSettings, HistogramData, LevelsSettings } from '../hooks/useImageProcessor';
import { INITIAL_LEVELS } from '../hooks/useImageProcessor';
import type { ImageInfo } from '../types/image';

interface LevelsDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (settings: FilterSettings) => void;
  currentSettings: FilterSettings;
  histograms: HistogramData | null;
  imageInfo: ImageInfo;
}

interface LevelsChannel {
  key: keyof FilterSettings;
  label: string;
  shortLabel: string;
  color: string;
}

const BASE_CHANNELS: Record<keyof FilterSettings, LevelsChannel> = {
  master: { key: 'master', label: 'RGB (Master)', shortLabel: 'RGB', color: '#f4f6f8' },
  r: { key: 'r', label: 'Red', shortLabel: 'R', color: '#ff6b6b' },
  g: { key: 'g', label: 'Green', shortLabel: 'G', color: '#4ddf86' },
  b: { key: 'b', label: 'Blue', shortLabel: 'B', color: '#65a9ff' },
  a: { key: 'a', label: 'Alpha', shortLabel: 'A', color: '#f2b84b' },
};

export const LevelsDialog: React.FC<LevelsDialogProps> = ({
  open,
  onClose,
  onApply,
  currentSettings,
  histograms,
  imageInfo,
}) => {
  const initialSettingsRef = useRef<FilterSettings>(currentSettings);
  const isFirstOpenRef = useRef(true);
  const [localSettings, setLocalSettings] = useState<FilterSettings>(currentSettings);
  const [selectedChannel, setSelectedChannel] = useState<keyof FilterSettings>('master');
  const [isPreviewEnabled, setIsPreviewEnabled] = useState(true);
  const [isLogScale, setIsLogScale] = useState(false);

  const availableChannels = useMemo(() => buildLevelsChannels(imageInfo), [imageInfo]);
  const selectedChannelAvailable = availableChannels.some(channel => channel.key === selectedChannel);
  const activeChannelKey = selectedChannelAvailable ? selectedChannel : availableChannels[0]?.key ?? 'master';

  useEffect(() => {
    if (open && isFirstOpenRef.current) {
      initialSettingsRef.current = currentSettings;
      setLocalSettings(currentSettings);
      setIsPreviewEnabled(true);
      setSelectedChannel(availableChannels[0]?.key ?? 'master');
      isFirstOpenRef.current = false;
    }

    if (!open) {
      isFirstOpenRef.current = true;
    }
  }, [open, currentSettings, availableChannels]);

  useEffect(() => {
    if (!open) return;
    onApply(isPreviewEnabled ? localSettings : initialSettingsRef.current);
  }, [isPreviewEnabled, localSettings, onApply, open]);

  const handleReset = () => {
    setLocalSettings(prev => ({
      ...prev,
      [activeChannelKey]: { ...INITIAL_LEVELS },
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
      const current = prev[activeChannelKey];
      if (key === 'black' && value >= current.white) return prev;
      if (key === 'white' && value <= current.black) return prev;

      return {
        ...prev,
        [activeChannelKey]: { ...current, [key]: value },
      };
    });
  };

  const handleRangeChange = (_: Event, value: number | number[]) => {
    if (!Array.isArray(value)) return;
    const [rawBlack, rawWhite] = value;
    const black = Math.min(rawBlack, rawWhite - 1);
    const white = Math.max(rawWhite, black + 1);

    setLocalSettings(prev => ({
      ...prev,
      [activeChannelKey]: {
        ...prev[activeChannelKey],
        black,
        white,
      },
    }));
  };

  const handleGammaPositionChange = (_: Event, value: number | number[]) => {
    if (Array.isArray(value)) return;
    updateChannelSetting('gamma', positionToGamma(value, currentChannelSettings.black, currentChannelSettings.white));
  };

  const histogramData = useMemo(() => {
    if (!histograms || !histograms[activeChannelKey]) return [];

    const data = histograms[activeChannelKey];
    const max = Math.max(...data);
    if (max <= 0) return Array.from(data).map(() => 0);

    return Array.from(data).map((value) => {
      if (isLogScale) {
        return Math.log(value + 1) / Math.log(max + 1);
      }

      return value / max;
    });
  }, [histograms, activeChannelKey, isLogScale]);

  if (!open) return null;

  const currentChannelSettings = localSettings[activeChannelKey];
  const activeChannel = availableChannels.find(channel => channel.key === activeChannelKey) ?? availableChannels[0] ?? BASE_CHANNELS.master;
  const gammaPosition = gammaToPosition(currentChannelSettings.gamma, currentChannelSettings.black, currentChannelSettings.white);
  const canMoveGamma = currentChannelSettings.white - currentChannelSettings.black > 2;

  return (
    <Box
      component="dialog"
      open={open}
      onCancel={(event) => {
        event.preventDefault();
        handleCancel();
      }}
      sx={{
        width: '100%',
        height: '100%',
        m: 0,
        p: 0,
        border: 0,
        color: 'text.primary',
        bgcolor: 'transparent',
        position: 'static',
        maxWidth: 'none',
        maxHeight: 'none',
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Paper
        square
        elevation={0}
        sx={{
          height: '100%',
          p: 2,
          bgcolor: '#181a1f',
          borderLeft: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              Уровни
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Гистограмма и входные уровни
            </Typography>
          </Box>
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box sx={{ minHeight: 0, overflow: 'auto', pr: 0.5 }}>
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Канал
            </Typography>
            <Box
              component="select"
              value={activeChannelKey}
              onChange={(event) => setSelectedChannel(event.target.value as keyof FilterSettings)}
              sx={{
                width: '100%',
                height: 36,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#202329',
                color: 'text.primary',
                px: 1,
              }}
            >
              {availableChannels.map(channel => (
                <option key={channel.key} value={channel.key}>
                  {channel.label}
                </option>
              ))}
            </Box>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              bgcolor: '#0f1013',
              borderColor: 'divider',
              height: 176,
              mb: 1,
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

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={isLogScale} onChange={event => setIsLogScale(event.target.checked)} />}
              label={<Typography variant="caption">Логарифмическая</Typography>}
            />
            <Chip size="small" label={activeChannel.shortLabel} sx={{ color: activeChannel.color }} />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Input Levels
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
              Полутона
            </Typography>
            <Typography variant="caption" color="text.secondary">
              gamma {currentChannelSettings.gamma.toFixed(2)}
            </Typography>
          </Stack>

          <Slider
            value={gammaPosition}
            onChange={handleGammaPositionChange}
            min={currentChannelSettings.black + 1}
            max={currentChannelSettings.white - 1}
            disabled={!canMoveGamma}
            sx={{
              mb: 1,
              color: activeChannel.key === 'master' ? 'primary.main' : activeChannel.color,
            }}
          />

          <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
            <Chip size="small" label={`Black ${currentChannelSettings.black}`} />
            <Chip size="small" label={`γ ${currentChannelSettings.gamma.toFixed(2)}`} />
            <Chip size="small" label={`White ${currentChannelSettings.white}`} />
          </Stack>
        </Box>

        <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <FormControlLabel
            control={<Checkbox checked={isPreviewEnabled} onChange={event => setIsPreviewEnabled(event.target.checked)} />}
            label="Предпросмотр"
            sx={{ mb: 1 }}
          />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
        </Box>
      </Paper>
    </Box>
  );
};

const buildLevelsChannels = (imageInfo: ImageInfo): LevelsChannel[] => {
  if (imageInfo.colorModel === 'none') return [BASE_CHANNELS.master];

  if (imageInfo.isGrayscale) {
    const channels: LevelsChannel[] = [
      {
        ...BASE_CHANNELS.master,
        label: 'Яркость (Master)',
        shortLabel: 'Y',
      },
    ];

    if (imageInfo.hasAlpha) {
      channels.push({
        ...BASE_CHANNELS.a,
        label: imageInfo.hasMask ? 'Mask / Alpha' : 'Alpha',
      });
    }

    return channels;
  }

  const channels = [
    BASE_CHANNELS.master,
    BASE_CHANNELS.r,
    BASE_CHANNELS.g,
    BASE_CHANNELS.b,
  ];

  if (imageInfo.hasAlpha) {
    channels.push(BASE_CHANNELS.a);
  }

  return channels;
};

const gammaToPosition = (gamma: number, black: number, white: number): number => {
  const range = white - black;
  if (range <= 2) return Math.round((black + white) / 2);

  const normalized = 0.5 - Math.log10(gamma) / (2 * Math.log10(9.9));
  return clamp(Math.round(black + normalized * range), black + 1, white - 1);
};

const positionToGamma = (position: number, black: number, white: number): number => {
  const range = white - black;
  if (range <= 2) return 1;

  const normalized = clamp((position - black) / range, 0, 1);
  const gamma = 10 ** ((0.5 - normalized) * 2 * Math.log10(9.9));
  return Number(clamp(gamma, 0.1, 9.9).toFixed(2));
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};
