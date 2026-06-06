import type { ChannelState } from '../hooks/useImageProcessor';

export type EdgeHandling = 'black' | 'white' | 'copy';

export interface KernelPreset {
  id: string;
  label: string;
  kernel: number[];
}

export interface KernelFilterSettings {
  kernel: number[];
  channels: ChannelState;
  edgeHandling: EdgeHandling;
}

export const IDENTITY_KERNEL = [0, 0, 0, 0, 1, 0, 0, 0, 0];

export const KERNEL_PRESETS: KernelPreset[] = [
  {
    id: 'identity',
    label: 'Тождественное отображение',
    kernel: IDENTITY_KERNEL,
  },
  {
    id: 'sharpen',
    label: 'Повышение резкости',
    kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  },
  {
    id: 'gaussian',
    label: 'Фильтр Гаусса 3×3',
    kernel: [
      1 / 16, 2 / 16, 1 / 16,
      2 / 16, 4 / 16, 2 / 16,
      1 / 16, 2 / 16, 1 / 16,
    ],
  },
  {
    id: 'box-blur',
    label: 'Прямоугольное размытие',
    kernel: [
      1 / 9, 1 / 9, 1 / 9,
      1 / 9, 1 / 9, 1 / 9,
      1 / 9, 1 / 9, 1 / 9,
    ],
  },
  {
    id: 'prewitt-x',
    label: 'Прюитт X',
    kernel: [-1, 0, 1, -1, 0, 1, -1, 0, 1],
  },
  {
    id: 'prewitt-y',
    label: 'Прюитт Y',
    kernel: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
  },
];

export const createDefaultKernelFilter = (): KernelFilterSettings => ({
  kernel: [...IDENTITY_KERNEL],
  channels: { r: true, g: true, b: true, a: false },
  edgeHandling: 'copy',
});

export const isIdentityKernelFilter = (settings: KernelFilterSettings | null): boolean => {
  if (!settings) return true;

  return settings.kernel.every((value, index) => value === IDENTITY_KERNEL[index]);
};
