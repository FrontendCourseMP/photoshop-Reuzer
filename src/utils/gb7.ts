const GB7_SIGNATURE = [0x47, 0x42, 0x37, 0x1D];

export function decodeGB7(buffer: ArrayBuffer): ImageData {
  const dataView = new DataView(buffer);
  
  // 1. Проверка сигнатуры
  for (let i = 0; i < 4; i++) {
    if (dataView.getUint8(i) !== GB7_SIGNATURE[i]) {
      throw new Error("Неверная сигнатура файла: это не GB7");
    }
  }

  // 2. Чтение заголовка
  const flags = dataView.getUint8(5);
  const hasAlpha = (flags & 0x01) !== 0; 
  const isColor = (flags & 0x02) !== 0;
  const width = dataView.getUint16(6, false);
  const height = dataView.getUint16(8, false);

  // 3. Чтение данных
  const pixelsOffset = 12;
  const pixels = new Uint8Array(buffer, pixelsOffset);
  const imageData = new ImageData(width, height);

  if (isColor) {
    const bytesPerPixel = hasAlpha ? 4 : 3;
    for (let i = 0; i < width * height; i++) {
      const srcIndex = i * bytesPerPixel;
      const destIndex = i * 4;
      
      imageData.data[destIndex] = pixels[srcIndex];     // R
      imageData.data[destIndex + 1] = pixels[srcIndex + 1]; // G
      imageData.data[destIndex + 2] = pixels[srcIndex + 2]; // B
      imageData.data[destIndex + 3] = hasAlpha ? pixels[srcIndex + 3] : 255; // A
    }
  } else {
    // Legacy grayscale support
    for (let i = 0; i < width * height; i++) {
      const byte = pixels[i];
      const gray7 = byte & 0x7F;
      const maskBit = (byte & 0x80) >> 7;
      const gray8 = Math.round((gray7 / 127) * 255);

      const rgbaIndex = i * 4;
      imageData.data[rgbaIndex] = gray8;
      imageData.data[rgbaIndex + 1] = gray8;
      imageData.data[rgbaIndex + 2] = gray8;
      imageData.data[rgbaIndex + 3] = hasAlpha ? (maskBit === 1 ? 255 : 0) : 255;
    }
  }

  return imageData;
}

export function encodeGB7(imageData: ImageData): ArrayBuffer {
  const { width, height, data } = imageData;
  
  // Всегда сохраняем в цвете, как просил пользователь
  // Используем 4 байта на пиксель (RGBA) для простоты и полноты данных
  const bytesPerPixel = 4;
  const buffer = new ArrayBuffer(12 + width * height * bytesPerPixel);
  const dataView = new DataView(buffer);
  const uint8Array = new Uint8Array(buffer);

  // 1. Запись сигнатуры
  GB7_SIGNATURE.forEach((byte, idx) => dataView.setUint8(idx, byte));
  
  // 2. Версия
  dataView.setUint8(4, 0x01);

  // 3. Флаги (0x01 - alpha, 0x02 - color)
  dataView.setUint8(5, 0x01 | 0x02);
  
  // 4. Размеры
  dataView.setUint16(6, width, false);
  dataView.setUint16(8, height, false);

  // 5. Данные (RGBA)
  const pixelsOffset = 12;
  for (let i = 0; i < width * height * 4; i++) {
    uint8Array[pixelsOffset + i] = data[i];
  }

  return buffer;
}
