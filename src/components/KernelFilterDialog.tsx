import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { BaseModal } from './BaseModal';
import type { ChannelState } from '../hooks/useImageProcessor';
import type { ImageInfo } from '../types/image';
import {
  KERNEL_PRESETS,
  createDefaultKernelFilter,
  isIdentityKernelFilter,
  type EdgeHandling,
  type KernelFilterSettings,
} from '../types/kernelFilter';

interface KernelFilterDialogProps {
  open: boolean;
  imageInfo: ImageInfo;
  currentSettings: KernelFilterSettings | null;
  onPreviewChange: (settings: KernelFilterSettings | null) => void;
  onApply: (settings: KernelFilterSettings | null) => void;
  onClose: () => void;
}

export const KernelFilterDialog = ({
  open,
  imageInfo,
  currentSettings,
  onPreviewChange,
  onApply,
  onClose,
}: KernelFilterDialogProps) => {
  const initialSettingsRef = useRef<KernelFilterSettings | null>(currentSettings);
  const isFirstOpenRef = useRef(true);
  const [localSettings, setLocalSettings] = useState<KernelFilterSettings>(() => currentSettings ?? createDefaultSettings(imageInfo));
  const [isPreviewEnabled, setIsPreviewEnabled] = useState(true);

  const channelItems = useMemo(() => buildChannelItems(imageInfo), [imageInfo]);
  const validationMessage = validateSettings(localSettings);

  useEffect(() => {
    if (open && isFirstOpenRef.current) {
      initialSettingsRef.current = currentSettings;
      setLocalSettings(currentSettings ?? createDefaultSettings(imageInfo));
      setIsPreviewEnabled(true);
      isFirstOpenRef.current = false;
    }

    if (!open) {
      isFirstOpenRef.current = true;
    }
  }, [currentSettings, imageInfo, open]);

  useEffect(() => {
    if (!open) return;
    onPreviewChange(isPreviewEnabled ? localSettings : initialSettingsRef.current);
  }, [isPreviewEnabled, localSettings, onPreviewChange, open]);

  const updateKernelValue = (index: number, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      kernel: prev.kernel.map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  };

  const updateChannels = (channels: ChannelState) => {
    setLocalSettings(prev => ({ ...prev, channels }));
  };

  const handlePresetChange = (presetId: string) => {
    const preset = KERNEL_PRESETS.find(item => item.id === presetId);
    if (!preset) return;

    setLocalSettings(prev => ({
      ...prev,
      kernel: [...preset.kernel],
    }));
  };

  const handleReset = () => {
    setLocalSettings(createDefaultSettings(imageInfo));
  };

  const handleClose = () => {
    onPreviewChange(initialSettingsRef.current);
    onClose();
  };

  const handleApply = () => {
    if (validationMessage) return;

    onApply(isIdentityKernelFilter(localSettings) ? null : localSettings);
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Фильтр ядром"
      subtitle="Свёртка 3×3 с выбором каналов"
      maxWidth="sm"
      draggable
      actions={(
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={<Checkbox checked={isPreviewEnabled} onChange={event => setIsPreviewEnabled(event.target.checked)} />}
            label="Предпросмотр"
          />
          <Stack direction="row" spacing={1}>
            <Button startIcon={<RestartAltIcon />} variant="text" onClick={handleReset}>
              Сбросить
            </Button>
            <Button variant="outlined" onClick={handleClose}>
              Закрыть
            </Button>
            <Button variant="contained" onClick={handleApply} disabled={!!validationMessage}>
              Применить
            </Button>
          </Stack>
        </Stack>
      )}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Преднастроенное ядро
          </Typography>
          <Box
            component="select"
            defaultValue="identity"
            onChange={event => handlePresetChange(event.target.value)}
            sx={selectSx}
          >
            {KERNEL_PRESETS.map(preset => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            Kernel 3×3
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {localSettings.kernel.map((value, index) => (
              <TextField
                key={index}
                type="number"
                value={Number.isFinite(value) ? value : ''}
                onChange={event => updateKernelValue(index, Number(event.target.value))}
                size="small"
                slotProps={{ htmlInput: { step: '0.0625' } }}
              />
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Каналы
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {channelItems.map(item => {
              const checked = item.keys.every(key => localSettings.channels[key]);

              return (
                <FormControlLabel
                  key={item.id}
                  control={(
                    <Checkbox
                      checked={checked}
                      onChange={() => {
                        const next = { ...localSettings.channels };
                        item.keys.forEach(key => {
                          next[key] = !checked;
                        });
                        updateChannels(next);
                      }}
                    />
                  )}
                  label={item.label}
                />
              );
            })}
          </Stack>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Обработка края
          </Typography>
          <Box
            component="select"
            value={localSettings.edgeHandling}
            onChange={event => setLocalSettings(prev => ({ ...prev, edgeHandling: event.target.value as EdgeHandling }))}
            sx={selectSx}
          >
            <option value="copy">Копирование края</option>
            <option value="black">Заполнение черным</option>
            <option value="white">Заполнение белым</option>
          </Box>
        </Box>

        {validationMessage && (
          <Alert severity="error">{validationMessage}</Alert>
        )}
      </Stack>
    </BaseModal>
  );
};

const createDefaultSettings = (imageInfo: ImageInfo): KernelFilterSettings => {
  const settings = createDefaultKernelFilter();
  settings.channels.a = false;

  if (imageInfo.isGrayscale) {
    settings.channels = { r: true, g: true, b: true, a: false };
  }

  return settings;
};

const validateSettings = (settings: KernelFilterSettings): string | null => {
  if (settings.kernel.length !== 9 || settings.kernel.some(value => !Number.isFinite(value))) {
    return 'Все 9 значений ядра должны быть числами.';
  }

  if (!settings.channels.r && !settings.channels.g && !settings.channels.b && !settings.channels.a) {
    return 'Выберите хотя бы один канал.';
  }

  return null;
};

const buildChannelItems = (imageInfo: ImageInfo) => {
  if (imageInfo.isGrayscale) {
    const items = [{ id: 'gray', label: 'Яркость', keys: ['r', 'g', 'b'] as Array<keyof ChannelState> }];
    if (imageInfo.hasAlpha) items.push({ id: 'a', label: 'Альфа', keys: ['a'] });
    return items;
  }

  const items = [
    { id: 'r', label: 'Red', keys: ['r'] as Array<keyof ChannelState> },
    { id: 'g', label: 'Green', keys: ['g'] as Array<keyof ChannelState> },
    { id: 'b', label: 'Blue', keys: ['b'] as Array<keyof ChannelState> },
  ];

  if (imageInfo.hasAlpha) items.push({ id: 'a', label: 'Alpha', keys: ['a'] });
  return items;
};

const selectSx = {
  width: '100%',
  height: 38,
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: '#202329',
  color: 'text.primary',
  px: 1,
};
