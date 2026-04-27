import type { RegionId } from '../../../shared/types';

export const regionIds: RegionId[] = [
  'top_left',
  'top_center',
  'top_right',
  'middle_left',
  'center',
  'middle_right',
  'bottom_left',
  'bottom_center',
  'bottom_right'
];

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

const normalized: Record<RegionId, Bounds> = {
  top_left: { x: 0, y: 0, w: 1 / 3, h: 1 / 3 },
  top_center: { x: 1 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
  top_right: { x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
  middle_left: { x: 0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
  center: { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
  middle_right: { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
  bottom_left: { x: 0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
  bottom_center: { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
  bottom_right: { x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 }
};

export const regionBounds = (id: RegionId, width: number, height: number, bleed = 0): Bounds => {
  const region = normalized[id];
  const x = region.x * width;
  const y = region.y * height;
  const w = region.w * width;
  const h = region.h * height;
  const bx = w * bleed;
  const by = h * bleed;
  return {
    x: Math.max(0, x - bx),
    y: Math.max(0, y - by),
    w: Math.min(width - Math.max(0, x - bx), w + bx * 2),
    h: Math.min(height - Math.max(0, y - by), h + by * 2)
  };
};

export const regionCenter = (id: RegionId, width: number, height: number): { x: number; y: number } => {
  const bounds = regionBounds(id, width, height);
  return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
};
