const GB7_SIGNATURE = [0x47, 0x42, 0x37, 0x1D];
const GB7_VERSION = 0x01;
const GB7_HEADER_SIZE = 12;
const MASK_FLAG = 0x01;

export interface GB7Info {
  width: number;
  height: number;
  version: number;
  hasMask: boolean;
}

export interface GB7DecodeResult {
  imageData: ImageData;
  info: GB7Info;
}

export function decodeGB7(buffer: ArrayBuffer): GB7DecodeResult {
  if (buffer.byteLength < GB7_HEADER_SIZE) {
    throw new Error('Файл слишком мал для заголовка GB7');
  }

  const dataView = new DataView(buffer);

  for (let i = 0; i < GB7_SIGNATURE.length; i++) {
    if (dataView.getUint8(i) !== GB7_SIGNATURE[i]) {
      throw new Error('Неверная сигнатура файла: это не GB7');
    }
  }

  const version = dataView.getUint8(4);
  if (version !== GB7_VERSION) {
    throw new Error(`Неподдерживаемая версия GB7: ${version}`);
  }

  const flags = dataView.getUint8(5);
  if ((flags & ~MASK_FLAG) !== 0) {
    throw new Error('В GB7 установлены зарезервированные флаги');
  }

  const width = dataView.getUint16(6, false);
  const height = dataView.getUint16(8, false);
  const reserved = dataView.getUint16(10, false);
  if (reserved !== 0) {
    throw new Error('Зарезервированные байты заголовка GB7 должны быть равны 0');
  }

  if (width === 0 || height === 0) {
    throw new Error('Ширина и высота GB7 должны быть больше 0');
  }

  const expectedSize = GB7_HEADER_SIZE + width * height;
  if (buffer.byteLength !== expectedSize) {
    throw new Error(`Некорректный размер GB7: ожидалось ${expectedSize} байт, получено ${buffer.byteLength}`);
  }

  const hasMask = (flags & MASK_FLAG) !== 0;
  const pixels = new Uint8Array(buffer, GB7_HEADER_SIZE);
  const imageData = new ImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const source = pixels[i];
    const gray7 = source & 0x7F;
    const gray8 = Math.round((gray7 / 127) * 255);
    const maskBit = source & 0x80;
    const rgbaIndex = i * 4;

    if (!hasMask && maskBit !== 0) {
      throw new Error('В GB7 без маски старший бит пикселя должен быть равен 0');
    }

    imageData.data[rgbaIndex] = gray8;
    imageData.data[rgbaIndex + 1] = gray8;
    imageData.data[rgbaIndex + 2] = gray8;
    imageData.data[rgbaIndex + 3] = hasMask ? (maskBit ? 255 : 0) : 255;
  }

  return {
    imageData,
    info: {
      width,
      height,
      version,
      hasMask,
    },
  };
}

export function encodeGB7(imageData: ImageData): ArrayBuffer {
  const { width, height, data } = imageData;

  if (width <= 0 || height <= 0 || width > 0xFFFF || height > 0xFFFF) {
    throw new Error('GB7 поддерживает размеры от 1 до 65535 пикселей по каждой оси');
  }

  const pixelCount = width * height;
  const hasMask = hasTransparentPixels(data);
  const buffer = new ArrayBuffer(GB7_HEADER_SIZE + pixelCount);
  const dataView = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  GB7_SIGNATURE.forEach((byte, index) => dataView.setUint8(index, byte));
  dataView.setUint8(4, GB7_VERSION);
  dataView.setUint8(5, hasMask ? MASK_FLAG : 0x00);
  dataView.setUint16(6, width, false);
  dataView.setUint16(8, height, false);
  dataView.setUint16(10, 0x0000, false);

  for (let i = 0; i < pixelCount; i++) {
    const rgbaIndex = i * 4;
    const gray8 = Math.round(
      0.299 * data[rgbaIndex] +
      0.587 * data[rgbaIndex + 1] +
      0.114 * data[rgbaIndex + 2]
    );
    const gray7 = Math.round((gray8 / 255) * 127) & 0x7F;
    const maskBit = hasMask && data[rgbaIndex + 3] >= 128 ? 0x80 : 0x00;

    bytes[GB7_HEADER_SIZE + i] = gray7 | maskBit;
  }

  return buffer;
}

function hasTransparentPixels(data: Uint8ClampedArray): boolean {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }

  return false;
}
