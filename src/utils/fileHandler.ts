import { decodeGB7, encodeGB7 } from './gb7';

export const handleImageFile = (
  file: File, 
  onLoad: (imageData: ImageData, depth: number) => void,
  onError: (msg: string) => void
) => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'gb7') {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const imageData = decodeGB7(buffer);
        onLoad(imageData, 32); // RGBA
      } catch (err) {
        onError("Ошибка чтения GB7: " + (err as Error).message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else if (['png', 'jpg', 'jpeg'].includes(extension || '')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return onError("Не удалось создать контекст 2D");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        onLoad(imageData, 24); // Standard
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  } else {
    onError("Неподдерживаемый формат файла.");
  }
};

export const downloadImage = (
  imageData: ImageData, 
  format: 'png' | 'jpg' | 'gb7'
) => {
  if (format === 'gb7') {
    const buffer = encodeGB7(imageData);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    triggerDownload(blob, 'image.gb7');
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx?.putImageData(imageData, 0, 0);
    
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
