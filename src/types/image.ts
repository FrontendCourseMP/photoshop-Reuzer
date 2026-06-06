export type ImageFormat = 'PNG' | 'JPG' | 'GB7' | 'none';

export interface ImageInfo {
  width: number;
  height: number;
  depth: number;
  depthLabel: string;
  format: ImageFormat;
  fileName: string;
  fileSize: number;
  hasMask?: boolean;
}

export const EMPTY_IMAGE_INFO: ImageInfo = {
  width: 0,
  height: 0,
  depth: 0,
  depthLabel: '0 bit',
  format: 'none',
  fileName: '',
  fileSize: 0,
};
