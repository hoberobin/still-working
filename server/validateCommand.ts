import type { ArtistCommand, CanvasAction, ColorMood, Mood, RegionId } from '../shared/types.js';
import { canvasActions, colorMoods, moods, regionIds } from '../shared/types.js';
import { neighbors } from './regions.js';

const forbiddenThoughts = ['i will', 'now drawing', 'as an ai', 'canvas engine', 'the viewer', 'json', 'api'];

const thoughtFallbacks = [
  'thin the center before it goes muddy',
  'leave the scrape visible under the wash',
  'return here and test the old decision',
  'soften the edge without losing the structure',
  'give this empty area a reason to exist',
  'remove the comfortable shape'
];

const isMood = (value: unknown): value is Mood => typeof value === 'string' && moods.includes(value as Mood);
const isAction = (value: unknown): value is CanvasAction =>
  typeof value === 'string' && canvasActions.includes(value as CanvasAction);
const isRegion = (value: unknown): value is RegionId =>
  typeof value === 'string' && regionIds.includes(value as RegionId);
const isColorMood = (value: unknown): value is ColorMood =>
  typeof value === 'string' && colorMoods.includes(value as ColorMood);

const clamp = (value: unknown, min: number, max: number, fallback: number): number => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

export const cleanThought = (input: unknown): string => {
  let thought = typeof input === 'string' ? input.trim() : '';
  thought = thought.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ');
  if (thought.length > 80) thought = thought.slice(0, 77).trimEnd() + '...';
  const lower = thought.toLowerCase();
  if (thought.length < 3 || forbiddenThoughts.some((phrase) => lower.includes(phrase))) {
    return thoughtFallbacks[Math.floor(Math.random() * thoughtFallbacks.length)];
  }
  return lower;
};

export const validateCommand = (raw: unknown, fallback?: ArtistCommand): ArtistCommand => {
  const value = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const targetRegion = isRegion(value.targetRegion) ? value.targetRegion : fallback?.targetRegion ?? 'center';
  const action = isAction(value.action) ? value.action : fallback?.action ?? 'pause_and_observe';
  const command: ArtistCommand = {
    mood: isMood(value.mood) ? value.mood : fallback?.mood ?? 'calm',
    thought: cleanThought(value.thought ?? fallback?.thought ?? 'hold still and find what is overworked'),
    action,
    targetRegion,
    intensity: clamp(value.intensity, 0, 1, fallback?.intensity ?? 0.45),
    durationMs: Math.round(clamp(value.durationMs, 2000, 12000, fallback?.durationMs ?? 6000))
  };

  if (isColorMood(value.colorMood)) command.colorMood = value.colorMood;
  else if (fallback?.colorMood) command.colorMood = fallback.colorMood;

  if (isRegion(value.secondaryRegion)) command.secondaryRegion = value.secondaryRegion;
  else if (fallback?.secondaryRegion) command.secondaryRegion = fallback.secondaryRegion;

  if (command.action === 'pull_color' && !command.secondaryRegion) {
    const options = neighbors[command.targetRegion];
    command.secondaryRegion = options[Math.floor(Math.random() * options.length)] ?? 'center';
  }

  return command;
};

export const parseJsonObject = (content: string): unknown => {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('OpenAI response did not contain JSON');
    return JSON.parse(match[0]);
  }
};
