import type { ColorMood, Mood } from '../../../shared/types';

const palettes = {
  mutedStudio: ['#eee9df', '#262622', '#9a4e37', '#596f83', '#6e7665', '#d2b36f'],
  dream: ['#202a38', '#8a849d', '#b8dce0', '#b7828b', '#60526d', '#e9e5dd'],
  brutalist: ['#111111', '#e8dfcf', '#9f2d22', '#74716b', '#c5a53a', '#2f3230']
};

const moodPalette: Record<Mood, string[]> = {
  calm: palettes.mutedStudio,
  restless: ['#efe9dc', '#202124', '#9a4e37', '#596f83', '#c5a53a', '#6e7665'],
  frustrated: palettes.brutalist,
  dreaming: palettes.dream,
  obsessive: ['#e8dfcf', '#151515', '#782c25', '#5f6a6b', '#a67c4b', '#3c4039']
};

const colorMoodPalette: Record<ColorMood, string[]> = {
  warm: ['#9a4e37', '#c5a53a', '#a67c4b', '#e8dfcf'],
  cool: ['#596f83', '#b8dce0', '#60526d', '#202a38'],
  neutral: ['#262622', '#74716b', '#eee9df', '#6e7665'],
  dark: ['#111111', '#202124', '#2f3230', '#782c25'],
  light: ['#eee9df', '#e8dfcf', '#b8dce0', '#d2b36f'],
  muted: ['#6e7665', '#8a849d', '#596f83', '#a67c4b'],
  vivid: ['#9f2d22', '#c5a53a', '#596f83', '#b7828b']
};

export const baseColor = '#e8e1d5';

export const pickColor = (mood: Mood, colorMood?: ColorMood, offset = 0): string => {
  const palette = colorMood ? colorMoodPalette[colorMood] : moodPalette[mood];
  const index = Math.abs(Math.floor(Math.random() * palette.length + offset)) % palette.length;
  return palette[index];
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  const int = Number.parseInt(clean, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
