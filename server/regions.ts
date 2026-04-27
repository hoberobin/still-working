import type { RegionId, RegionState } from '../shared/types.js';
import { regionIds } from '../shared/types.js';

const coords: Record<RegionId, Pick<RegionState, 'x' | 'y' | 'w' | 'h'>> = {
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

export const createInitialRegions = (): Record<RegionId, RegionState> => {
  const now = Date.now();
  return Object.fromEntries(
    regionIds.map((id, index) => [
      id,
      {
        id,
        ...coords[id],
        density: 0.06 + ((index * 17) % 9) / 100,
        contrast: 0.05 + ((index * 11) % 8) / 100,
        lastTouchedAt: now - (index + 1) * 90000,
        touchCount: 0,
        dominantMood: 'calm'
      }
    ])
  ) as Record<RegionId, RegionState>;
};

export const neighbors: Record<RegionId, RegionId[]> = {
  top_left: ['top_center', 'middle_left', 'center'],
  top_center: ['top_left', 'top_right', 'center'],
  top_right: ['top_center', 'middle_right', 'center'],
  middle_left: ['top_left', 'center', 'bottom_left'],
  center: ['top_center', 'middle_left', 'middle_right', 'bottom_center'],
  middle_right: ['top_right', 'center', 'bottom_right'],
  bottom_left: ['middle_left', 'bottom_center', 'center'],
  bottom_center: ['bottom_left', 'center', 'bottom_right'],
  bottom_right: ['middle_right', 'bottom_center', 'center']
};
