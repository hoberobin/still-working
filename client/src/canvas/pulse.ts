import type { Mood } from '../../../shared/types';

const speedByMood: Record<Mood, number> = {
  calm: 0.00055,
  restless: 0.0014,
  frustrated: 0.0022,
  dreaming: 0.00042,
  obsessive: 0.0011
};

export const pulseValue = (mood: Mood, time: number): number => {
  const speed = speedByMood[mood];
  const base = (Math.sin(time * speed) + 1) / 2;
  if (mood === 'frustrated') return Math.pow(base, 5);
  if (mood === 'restless') return Math.abs(Math.sin(time * speed * 1.7)) * 0.7 + base * 0.3;
  if (mood === 'obsessive') return Math.round(base * 5) / 5;
  return base;
};
