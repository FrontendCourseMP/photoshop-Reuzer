import { Box, Typography, Chip } from '@mui/material';
import type { ImageInfo } from '../types/image';

interface StatusBarProps {
  imageInfo: ImageInfo;
  isProcessing: boolean;
  hasImage: boolean;
}

export const StatusBar = ({ imageInfo, isProcessing, hasImage }: StatusBarProps) => {
  return (
    <Box
      sx={{
        minHeight: 34,
        px: { xs: 1.5, md: 2 },
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: '#15171b',
        color: 'text.secondary',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>
        Status
      </Typography>

      {hasImage ? (
        <>
          <Chip size="small" label={imageInfo.format} sx={{ height: 22 }} />
          <StatusItem label="Ширина" value={`${imageInfo.width}px`} />
          <StatusItem label="Высота" value={`${imageInfo.height}px`} />
          <StatusItem label="Глубина" value={imageInfo.depthLabel} />
          {imageInfo.hasMask && <StatusItem label="Маска" value="есть" />}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              ml: { xs: 0, md: 1 },
            }}
          >
            {imageInfo.fileName}
          </Typography>
        </>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Файл не загружен
        </Typography>
      )}

      <Box sx={{ flexGrow: 1 }} />
      <Typography variant="caption" color={isProcessing ? 'primary.main' : 'text.secondary'}>
        {isProcessing ? 'Обработка...' : 'Готово'}
      </Typography>
    </Box>
  );
};

const StatusItem = ({ label, value }: { label: string; value: string }) => (
  <Typography variant="caption" color="text.secondary" sx={{ display: { xs: label === 'Глубина' ? 'none' : 'inline', sm: 'inline' } }}>
    {label}: <Box component="span" sx={{ color: 'text.primary', fontFamily: 'ui-monospace, Consolas, monospace' }}>{value}</Box>
  </Typography>
);
