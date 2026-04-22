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
  // const version = dataView.getUint8(4); // 0x01, пока не используем строго
  const flags = dataView.getUint8(5);
  const hasMask = (flags & 0x01) === 1; // Бит 0
  const width = dataView.getUint16(6, false); // Big Endian
  const height = dataView.getUint16(8, false); // Big Endian

  // 3. Чтение данных
  const pixelsOffset = 12;
  const pixels = new Uint8Array(buffer, pixelsOffset);
  const imageData = new ImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const byte = pixels[i];
    const gray7 = byte & 0x7F; // Младшие 7 бит
    const maskBit = (byte & 0x80) >> 7; // Старший бит (MSB)

    // Масштабируем 7-битный серый (0-127) в 8-битный (0-255) для Canvas
    const gray8 = Math.round((gray7 / 127) * 255);

    const rgbaIndex = i * 4;
    imageData.data[rgbaIndex] = gray8;     // R
    imageData.data[rgbaIndex + 1] = gray8; // G
    imageData.data[rgbaIndex + 2] = gray8; // B
    
    // Альфа-канал
    if (hasMask) {
      imageData.data[rgbaIndex + 3] = maskBit === 1 ? 255 : 0;
    } else {
      imageData.data[rgbaIndex + 3] = 255;
    }
  }

  return imageData;
}

export function encodeGB7(imageData: ImageData): ArrayBuffer {
  const { width, height, data } = imageData;
  const buffer = new ArrayBuffer(12 + width * height);
  const dataView = new DataView(buffer);
  const uint8Array = new Uint8Array(buffer);

  // 1. Запись сигнатуры
  GB7_SIGNATURE.forEach((byte, idx) => dataView.setUint8(idx, byte));
  
  // 2. Версия
  dataView.setUint8(4, 0x01);

  // 3. Проверяем, нужна ли маска (есть ли прозрачные пиксели)
  let needsMask = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      needsMask = true;
      break;
    }
  }
  
  // Запись флагов (Бит 0 = маска)
  dataView.setUint8(5, needsMask ? 0x01 : 0x00);
  
  // Запись ширины и высоты (Big Endian)
  dataView.setUint16(6, width, false);
  dataView.setUint16(8, height, false);
  
  // Резервные 2 байта уже заполнены нулями (ArrayBuffer инициализируется нулями)

  // 4. Запись данных
  const pixelsOffset = 12;
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];

    // Формула яркости (оттенки серого)
    const gray8 = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    
    // Масштабируем 8 бит в 7 бит
    const gray7 = Math.round((gray8 / 255) * 127);
    let byte = gray7 & 0x7F;

    if (needsMask) {
      const maskBit = a > 127 ? 1 : 0;
      byte |= (maskBit << 7); // Записываем в MSB
    }

    uint8Array[pixelsOffset + i] = byte;
  }

  return buffer;
}