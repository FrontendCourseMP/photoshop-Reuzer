import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { decodeGB7, encodeGB7 } from './utils/gb7';
import { 
  Box, Button, Typography, AppBar, Toolbar, CssBaseline, ThemeProvider, createTheme 
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';

// Темная тема для схожести с редакторами
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#1e1e1e', paper: '#252526' }
  },
});

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0, depth: 0 });

  // Загрузка
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'gb7') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const imageData = decodeGB7(buffer);
          drawToCanvas(imageData);
          setImageInfo({ width: imageData.width, height: imageData.height, depth: 8 });
        } catch (err) {
          alert("Ошибка чтения GB7: " + (err as Error).message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (['png', 'jpg', 'jpeg'].includes(extension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          setImageInfo({ width: img.width, height: img.height, depth: 24 }); // Условно 24 для стандартных
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      alert("Неподдерживаемый формат файла.");
    }
    event.target.value = ''; // Сброс инпута
  };

  const drawToCanvas = (imageData: ImageData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx?.putImageData(imageData, 0, 0);
  };

  // Скачивание
  const handleDownload = (format: 'png' | 'jpg' | 'gb7') => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return alert("Сначала загрузите изображение!");

    if (format === 'gb7') {
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) return;

      const buffer = encodeGB7(imageData);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      triggerDownload(blob, 'image.gb7');
    } else {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, `image.${format}`);
      }, mimeType);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* Верхняя панель инструментов */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar variant="dense" sx={{ gap: 2 }}>
            <Button component="label" variant="contained" startIcon={<FileUploadIcon />}>
              Открыть
              <input type="file" hidden accept=".png,.jpg,.jpeg,.gb7" onChange={handleFileUpload} />
            </Button>
            
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleDownload('png')}>
              PNG
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleDownload('jpg')}>
              JPG
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleDownload('gb7')}>
              GB7
            </Button>
          </Toolbar>
        </AppBar>

        {/* Рабочая область с холстом */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          bgcolor: '#1e1e1e',
          p: 2
        }}>
          <canvas 
            ref={canvasRef} 
            style={{ 
              boxShadow: '0 0 10px rgba(0,0,0,0.5)',
              maxWidth: '100%',
              objectFit: 'contain',
              background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYNgRwEg9AMw4+nAwMDIyMSiE0DSyAEYmBqUQTKqGURtGbRhRBxAaARAA/6AOBf0nOq0AAAAASUVORK5CYII=) repeat' // Шахматка для прозрачности
            }} 
          />
        </Box>

        {/* Строка состояния (Status bar) */}
        <Box sx={{ 
          px: 2, py: 0.5, 
          bgcolor: 'background.paper', 
          borderTop: '1px solid #333',
          display: 'flex',
          gap: 4
        }}>
          <Typography variant="caption">Ширина: {imageInfo.width}px</Typography>
          <Typography variant="caption">Высота: {imageInfo.height}px</Typography>
          <Typography variant="caption">Глубина цвета: {imageInfo.depth} bit</Typography>
        </Box>

      </Box>
    </ThemeProvider>
  );
}

export default App;