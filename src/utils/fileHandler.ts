import { decodeGB7, encodeGB7 } from './gb7';
import type { ImageFormat, ImageInfo } from '../types/image';

export const handleImageFile = (
  file: File,
  onLoad: (imageData: ImageData, info: ImageInfo) => void,
  onError: (msg: string) => void
) => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'gb7') {
    readArrayBuffer(file, (buffer) => {
      try {
        const { imageData, info } = decodeGB7(buffer);
        onLoad(imageData, {
          width: info.width,
          height: info.height,
          depth: 7,
          depthLabel: info.hasMask ? '7 bit + mask' : '7 bit',
          format: 'GB7',
          fileName: file.name,
          fileSize: file.size,
          hasMask: info.hasMask,
        });
      } catch (err) {
        onError('Ошибка чтения GB7: ' + (err as Error).message);
      }
    }, onError);
    return;
  }

  if (['png', 'jpg', 'jpeg'].includes(extension || '')) {
    readArrayBuffer(file, (buffer) => {
      loadRasterImage(file, (imageData) => {
        const format: ImageFormat = extension === 'png' ? 'PNG' : 'JPG';
        const parsedInfo = format === 'PNG' ? parsePngInfo(buffer) : parseJpegInfo(buffer);
        const width = parsedInfo?.width ?? imageData.width;
        const height = parsedInfo?.height ?? imageData.height;
        const depth = parsedInfo?.depth ?? (format === 'PNG' ? 32 : 24);

        onLoad(imageData, {
          width,
          height,
          depth,
          depthLabel: `${depth} bit`,
          format,
          fileName: file.name,
          fileSize: file.size,
        });
      }, onError);
    }, onError);
    return;
  }

  onError('Неподдерживаемый формат файла.');
};

export const downloadImage = (
  imageData: ImageData,
  format: 'png' | 'jpg' | 'gb7'
) => {
  if (format === 'gb7') {
    const buffer = encodeGB7(imageData);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    triggerDownload(blob, 'image.gb7');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Не удалось создать контекст 2D для экспорта');
  }

  if (format === 'jpg') {
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = imageData.width;
    sourceCanvas.height = imageData.height;
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) {
      throw new Error('Не удалось создать временный контекст 2D для JPG');
    }

    sourceCtx.putImageData(imageData, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceCanvas, 0, 0);
  } else {
    ctx.putImageData(imageData, 0, 0);
  }

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, `image.${format}`);
  }, mimeType, format === 'jpg' ? 0.92 : undefined);
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

const readArrayBuffer = (
  file: File,
  onLoad: (buffer: ArrayBuffer) => void,
  onError: (msg: string) => void
) => {
  const reader = new FileReader();
  reader.onload = (event) => onLoad(event.target?.result as ArrayBuffer);
  reader.onerror = () => onError('Не удалось прочитать файл.');
  reader.readAsArrayBuffer(file);
};

const loadRasterImage = (
  file: File,
  onLoad: (imageData: ImageData) => void,
  onError: (msg: string) => void
) => {
  const img = new Image();
  const url = URL.createObjectURL(file);

  img.onload = () => {
    URL.revokeObjectURL(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onError('Не удалось создать контекст 2D');
      return;
    }

    ctx.drawImage(img, 0, 0);
    onLoad(ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight));
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    onError('Не удалось загрузить изображение.');
  };

  img.src = url;
};

const parsePngInfo = (buffer: ArrayBuffer): { width: number; height: number; depth: number } | null => {
  if (buffer.byteLength < 33) return null;

  const bytes = new Uint8Array(buffer);
  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const isPng = pngSignature.every((byte, index) => bytes[index] === byte);
  if (!isPng || readAscii(bytes, 12, 4) !== 'IHDR') return null;

  const dataView = new DataView(buffer);
  const width = dataView.getUint32(16, false);
  const height = dataView.getUint32(20, false);
  const bitDepth = dataView.getUint8(24);
  const colorType = dataView.getUint8(25);
  const samplesByColorType: Record<number, number> = {
    0: 1,
    2: 3,
    3: 1,
    4: 2,
    6: 4,
  };
  const samples = samplesByColorType[colorType] ?? 4;

  return {
    width,
    height,
    depth: bitDepth * samples,
  };
};

const parseJpegInfo = (buffer: ArrayBuffer): { width: number; height: number; depth: number } | null => {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) return null;

  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xFF) {
      offset++;
      continue;
    }

    while (bytes[offset] === 0xFF) offset++;
    const marker = bytes[offset++];

    if (marker === 0xD9 || marker === 0xDA) break;
    if (offset + 1 >= bytes.length) break;

    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

    if (isStartOfFrame(marker)) {
      const precision = bytes[offset + 2];
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const components = bytes[offset + 7];

      return {
        width,
        height,
        depth: precision * components,
      };
    }

    offset += segmentLength;
  }

  return null;
};

const isStartOfFrame = (marker: number) => (
  (marker >= 0xC0 && marker <= 0xC3) ||
  (marker >= 0xC5 && marker <= 0xC7) ||
  (marker >= 0xC9 && marker <= 0xCB) ||
  (marker >= 0xCD && marker <= 0xCF)
);

const readAscii = (bytes: Uint8Array, offset: number, length: number) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(bytes[offset + i]);
  }

  return result;
};
