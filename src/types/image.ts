export type ImageFormat = 'PNG' | 'JPG' | 'GB7' | 'none';
export type ImageColorModel = 'none' | 'grayscale' | 'grayscale-alpha' | 'rgb' | 'rgba';

export interface ImageInfo {
  width: number;
  height: number;
  depth: number;
  depthLabel: string;
  format: ImageFormat;
  colorModel: ImageColorModel;
  fileName: string;
  fileSize: number;
  hasAlpha: boolean;
  isGrayscale: boolean;
  hasMask?: boolean;
}

export const EMPTY_IMAGE_INFO: ImageInfo = {
  width: 0,
  height: 0,
  depth: 0,
  depthLabel: '0 bit',
  format: 'none',
  colorModel: 'none',
  fileName: '',
  fileSize: 0,
  hasAlpha: false,
  isGrayscale: false,
};
