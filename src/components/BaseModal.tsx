import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface BaseModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  draggable?: boolean;
}

export const BaseModal = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  actions,
  maxWidth = 'sm',
  draggable = false,
}: BaseModalProps) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    if (!draggable) return;

    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      setOffset({
        x: dragState.originX + event.clientX - dragState.startX,
        y: dragState.originY + event.clientY - dragState.startY,
      });
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggable]);

  const startDrag = (event: React.MouseEvent) => {
    if (!draggable || event.button !== 0) return;

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#1b1d22',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 28px 80px rgba(0,0,0,0.55)',
            transform: draggable ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 2.25, pb: 1.25, cursor: draggable ? 'move' : 'default' }} onMouseDown={startDrag}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack spacing={0.25}>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>
          <IconButton onClick={onClose} size="small" onMouseDown={(event) => event.stopPropagation()}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 2.25, pb: 1.5 }}>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions sx={{ px: 2.25, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};
