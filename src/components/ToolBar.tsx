import React, { useState } from 'react';
import { AppBar, Toolbar, Button, IconButton, Tooltip, Box, Typography, Chip, Menu, MenuItem, Divider } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import ColorizeIcon from '@mui/icons-material/Colorize';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import type { ImageInfo } from '../types/image';

interface ToolBarProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: (format: 'png' | 'jpg' | 'gb7') => void;
  isEyedropperActive: boolean;
  onToggleEyedropper: () => void;
  onOpenLevels: () => void;
  onOpenResize: () => void;
  hasImage: boolean;
  imageInfo: ImageInfo;
}

export const ToolBar: React.FC<ToolBarProps> = ({ 
  onFileUpload, 
  onDownload, 
  isEyedropperActive, 
  onToggleEyedropper,
  onOpenLevels,
  onOpenResize,
  hasImage,
  imageInfo
}) => {
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
  const isDownloadMenuOpen = Boolean(downloadAnchor);

  const handleDownload = (format: 'png' | 'jpg' | 'gb7') => {
    onDownload(format);
    setDownloadAnchor(null);
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        bgcolor: '#17191e',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: { xs: 64, sm: 72 }, px: { xs: 1.5, sm: 2.5 } }}>
        <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5, mr: 'auto' }}>
          <Box sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(46, 211, 183, 0.12)',
            color: 'primary.main',
            fontWeight: 900,
            border: '1px solid rgba(46, 211, 183, 0.32)',
          }}>
            G7
          </Box>
          <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              GB7 Studio
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Каналы, уровни, пипетка
            </Typography>
          </Box>
        </Box>

        <Chip
          size="small"
          color={hasImage ? 'primary' : 'default'}
          variant={hasImage ? 'outlined' : 'filled'}
          label={hasImage ? `${imageInfo.width}×${imageInfo.height} · ${imageInfo.depthLabel}` : 'Нет файла'}
          sx={{
            display: { xs: 'none', md: 'inline-flex' },
            minWidth: 96,
            borderColor: hasImage ? 'rgba(46, 211, 183, 0.45)' : 'divider',
            bgcolor: hasImage ? 'rgba(46, 211, 183, 0.08)' : '#22252b',
          }}
        />

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

        <Button 
          component="label" 
          variant="contained" 
          startIcon={<FileUploadIcon />}
          sx={{ px: { xs: 1.5, sm: 2.25 } }}
        >
          Открыть
          <input type="file" hidden accept=".png,.jpg,.jpeg,.gb7" onChange={onFileUpload} />
        </Button>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          endIcon={<ExpandMoreIcon />}
          disabled={!hasImage}
          onClick={(event) => setDownloadAnchor(event.currentTarget)}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          Сохранить
        </Button>
        <Tooltip title="Сохранить">
          <span>
            <IconButton
              disabled={!hasImage}
              onClick={(event) => setDownloadAnchor(event.currentTarget)}
              sx={{
                display: { xs: 'inline-flex', sm: 'none' },
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#202329',
              }}
            >
              <DownloadIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Menu
          anchorEl={downloadAnchor}
          open={isDownloadMenuOpen}
          onClose={() => setDownloadAnchor(null)}
          slotProps={{ list: { dense: true } }}
        >
          <MenuItem onClick={() => handleDownload('png')}>PNG</MenuItem>
          <MenuItem onClick={() => handleDownload('jpg')}>JPG</MenuItem>
          <MenuItem onClick={() => handleDownload('gb7')}>GB7</MenuItem>
        </Menu>

        <Tooltip title="Пипетка">
          <span>
            <IconButton 
              color={isEyedropperActive ? 'primary' : 'default'} 
              onClick={onToggleEyedropper}
              disabled={!hasImage}
              sx={{ 
                border: '1px solid',
                borderColor: isEyedropperActive ? 'primary.main' : 'divider',
                bgcolor: isEyedropperActive ? 'rgba(46, 211, 183, 0.12)' : '#202329',
                '&:hover': { bgcolor: isEyedropperActive ? 'rgba(46, 211, 183, 0.18)' : '#292d35' },
              }}
            >
              <ColorizeIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Уровни">
          <span>
            <IconButton 
              onClick={onOpenLevels}
              disabled={!hasImage}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#202329',
                '&:hover': { bgcolor: '#292d35' },
              }}
            >
              <TuneIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Размер изображения">
          <span>
            <IconButton
              onClick={onOpenResize}
              disabled={!hasImage}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#202329',
                '&:hover': { bgcolor: '#292d35' },
              }}
            >
              <AspectRatioIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
