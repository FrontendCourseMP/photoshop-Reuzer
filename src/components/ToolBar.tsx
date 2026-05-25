import React from 'react';
import { AppBar, Toolbar, Button, ButtonGroup, IconButton, Tooltip } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import ColorizeIcon from '@mui/icons-material/Colorize';
import LayersIcon from '@mui/icons-material/Layers';

interface ToolBarProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: (format: 'png' | 'jpg' | 'gb7') => void;
  isEyedropperActive: boolean;
  onToggleEyedropper: () => void;
  onOpenLevels: () => void;
  hasImage: boolean;
}

export const ToolBar: React.FC<ToolBarProps> = ({ 
  onFileUpload, 
  onDownload, 
  isEyedropperActive, 
  onToggleEyedropper,
  onOpenLevels,
  hasImage
}) => {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar variant="dense" sx={{ gap: 2 }}>
        <Button component="label" variant="contained" startIcon={<FileUploadIcon />}>
          Открыть
          <input type="file" hidden accept=".png,.jpg,.jpeg,.gb7" onChange={onFileUpload} />
        </Button>
        
        <ButtonGroup variant="outlined" disabled={!hasImage}>
          <Button startIcon={<DownloadIcon />} onClick={() => onDownload('png')}>PNG</Button>
          <Button onClick={() => onDownload('jpg')}>JPG</Button>
          <Button onClick={() => onDownload('gb7')}>GB7</Button>
        </ButtonGroup>

        <Tooltip title="Пипетка">
          <IconButton 
            color={isEyedropperActive ? 'primary' : 'default'} 
            onClick={onToggleEyedropper}
            disabled={!hasImage}
            sx={{ border: isEyedropperActive ? '1px solid' : 'none' }}
          >
            <ColorizeIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Уровни">
          <IconButton 
            onClick={onOpenLevels}
            disabled={!hasImage}
          >
            <LayersIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
