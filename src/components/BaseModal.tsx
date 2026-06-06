import React from 'react';
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
}

export const BaseModal = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  actions,
  maxWidth = 'sm',
}: BaseModalProps) => (
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
        },
      },
    }}
  >
    <DialogTitle sx={{ p: 2.25, pb: 1.25 }}>
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
        <IconButton onClick={onClose} size="small">
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
