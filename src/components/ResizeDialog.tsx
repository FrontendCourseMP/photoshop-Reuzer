import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import { BaseModal } from './BaseModal';
import {
  INTERPOLATION_OPTIONS,
  getInterpolationOption,
  resizeImageData,
  type InterpolationMethod,
} from '../utils/interpolation';

interface ResizeDialogProps {
  open: boolean;
  imageData: ImageData;
  defaultMethod: InterpolationMethod;
  onClose: () => void;
  onApply: (imageData: ImageData) => void;
}

type ResizeUnit = 'percent' | 'pixels';

const MAX_DIMENSION = 10000;
const MAX_PIXELS = 64_000_000;

export const ResizeDialog = ({
  open,
  imageData,
  defaultMethod,
  onClose,
  onApply,
}: ResizeDialogProps) => {
  const [unit, setUnit] = useState<ResizeUnit>('percent');
  const [targetWidth, setTargetWidth] = useState(imageData.width);
  const [targetHeight, setTargetHeight] = useState(imageData.height);
  const [isLinked, setIsLinked] = useState(true);
  const [method, setMethod] = useState<InterpolationMethod>(defaultMethod);

  const aspectRatio = imageData.width / imageData.height;
  const selectedMethod = getInterpolationOption(method);
  const validationMessage = validateSize(targetWidth, targetHeight);
  const beforeMegapixels = formatMegapixels(imageData.width * imageData.height);
  const afterMegapixels = formatMegapixels(targetWidth * targetHeight);

  const displayedValues = useMemo(() => {
    if (unit === 'pixels') {
      return {
        width: targetWidth,
        height: targetHeight,
      };
    }

    return {
      width: Math.round(targetWidth / imageData.width * 100),
      height: Math.round(targetHeight / imageData.height * 100),
    };
  }, [imageData.height, imageData.width, targetHeight, targetWidth, unit]);

  const handleWidthChange = (value: number) => {
    const width = unit === 'pixels' ? value : Math.round(imageData.width * value / 100);
    const height = isLinked ? Math.round(width / aspectRatio) : targetHeight;
    setTargetWidth(width);
    setTargetHeight(height);
  };

  const handleHeightChange = (value: number) => {
    const height = unit === 'pixels' ? value : Math.round(imageData.height * value / 100);
    const width = isLinked ? Math.round(height * aspectRatio) : targetWidth;
    setTargetWidth(width);
    setTargetHeight(height);
  };

  const handleApply = () => {
    if (validationMessage) return;
    onApply(resizeImageData(imageData, targetWidth, targetHeight, method));
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Размер изображения"
      subtitle="Создать изображение с новыми размерами"
      actions={(
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="outlined" onClick={onClose}>Отмена</Button>
          <Button variant="contained" onClick={handleApply} disabled={!!validationMessage}>Применить</Button>
        </Stack>
      )}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5}>
          <Metric label="До" value={beforeMegapixels} />
          <Metric label="После" value={afterMegapixels} />
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Единицы
          </Typography>
          <Box
            component="select"
            value={unit}
            onChange={(event) => setUnit(event.target.value as ResizeUnit)}
            sx={selectSx}
          >
            <option value="percent">Проценты</option>
            <option value="pixels">Пиксели</option>
          </Box>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label={unit === 'pixels' ? 'Ширина, px' : 'Ширина, %'}
            type="number"
            value={displayedValues.width}
            onChange={(event) => handleWidthChange(Number(event.target.value))}
            fullWidth
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <TextField
            label={unit === 'pixels' ? 'Высота, px' : 'Высота, %'}
            type="number"
            value={displayedValues.height}
            onChange={(event) => handleHeightChange(Number(event.target.value))}
            fullWidth
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </Stack>

        <FormControlLabel
          control={<Checkbox checked={isLinked} onChange={(event) => setIsLinked(event.target.checked)} />}
          label="Сохранять пропорции"
        />

        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Алгоритм интерполяции
            </Typography>
            <Tooltip title={selectedMethod.description}>
              <HelpIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
            </Tooltip>
          </Stack>
          <Box
            component="select"
            value={method}
            onChange={(event) => setMethod(event.target.value as InterpolationMethod)}
            sx={selectSx}
          >
            {INTERPOLATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Box>
        </Box>

        {validationMessage && (
          <Alert severity="error">
            {validationMessage}
          </Alert>
        )}
      </Stack>
    </BaseModal>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ flex: 1, p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.025)' }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{value}</Typography>
  </Box>
);

const validateSize = (width: number, height: number): string | null => {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return 'Ширина и высота должны быть числами.';
  if (width < 1 || height < 1) return 'Минимальный размер изображения: 1×1 пиксель.';
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) return `Максимальный размер по каждой стороне: ${MAX_DIMENSION}px.`;
  if (width * height > MAX_PIXELS) return 'Итоговое изображение слишком большое. Максимум: 64 мегапикселя.';

  return null;
};

const formatMegapixels = (pixels: number): string => {
  return `${(pixels / 1_000_000).toFixed(2)} MP`;
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
