import type { ArtistCommand, CanvasAction, CanvasState, ColorMood, Mood, RegionId } from '../shared/types.js';
import { canvasActions, regionIds } from '../shared/types.js';
import { neighbors } from './regions.js';
import { validateCommand } from './validateCommand.js';

const thoughtBank: Record<Mood, string[]> = {
  calm: [
    'soften this edge so the weight can settle',
    'leave more air around the mark',
    'let the pale layer hold the surface open',
    'reduce the contrast before it takes over',
    'make the transition less abrupt'
  ],
  restless: [
    'break the balance before it gets too polite',
    'put pressure where the surface has gone slack',
    'move the eye out of its usual path',
    'add a mark that makes the corner answer',
    'shift the weight before it hardens'
  ],
  frustrated: [
    'scrape out the part that feels too resolved',
    'cut across the clean area to expose the layer below',
    'darken this until it stops behaving',
    'remove the comfortable shape',
    'make the surface show the correction'
  ],
  dreaming: [
    'blur this edge until the form loosens',
    'pull the color sideways to loosen the edge',
    'wash over the line without hiding it',
    'make the boundary less certain',
    'let the underlayer show through softly'
  ],
  obsessive: [
    'return here and test the old decision',
    'repeat the mark until the imbalance shows',
    'press into the same corner with less mercy',
    'keep the previous scrape visible',
    'work the old scrape into the composition'
  ]
};

const moodColors: Record<Mood, ColorMood[]> = {
  calm: ['neutral', 'muted', 'light'],
  restless: ['warm', 'cool', 'vivid'],
  frustrated: ['dark', 'warm', 'neutral'],
  dreaming: ['cool', 'muted', 'light'],
  obsessive: ['dark', 'muted', 'warm']
};

const transitions: Record<Mood, Mood[]> = {
  calm: ['calm', 'calm', 'dreaming', 'restless'],
  restless: ['restless', 'calm', 'frustrated', 'obsessive'],
  frustrated: ['frustrated', 'calm', 'restless'],
  dreaming: ['dreaming', 'calm', 'obsessive'],
  obsessive: ['obsessive', 'frustrated', 'dreaming', 'calm']
};

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const weightedPick = <T>(items: Array<{ value: T; weight: number }>): T => {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  let cursor = Math.random() * total;
  for (const item of items) {
    cursor -= Math.max(0, item.weight);
    if (cursor <= 0) return item.value;
  }
  return items[items.length - 1].value;
};

const maybeShiftMood = (state: CanvasState): Mood => {
  if (Math.random() > 0.38) return state.currentMood;
  return pick(transitions[state.currentMood]);
};

const chooseRegion = (state: CanvasState, mood: Mood): RegionId => {
  const regions = Object.values(state.regions);
  const oldest = [...regions].sort((a, b) => a.lastTouchedAt - b.lastTouchedAt)[0];
  const emptiest = [...regions].sort((a, b) => a.density - b.density)[0];
  const densest = [...regions].sort((a, b) => b.density - a.density)[0];
  const mostTouched = [...regions].sort((a, b) => b.touchCount - a.touchCount)[0];

  return weightedPick<RegionId>([
    { value: oldest.id, weight: 1.2 },
    { value: emptiest.id, weight: emptiest.density < 0.22 ? 2.1 : 0.8 },
    { value: densest.id, weight: densest.density > 0.72 ? 2 : 0.7 },
    { value: mostTouched.id, weight: mood === 'obsessive' ? 2.4 : state.artistTaste.revisitBias },
    { value: pick(regionIds), weight: state.artistTaste.chaosTolerance + 0.35 }
  ]);
};

const chooseAction = (state: CanvasState, mood: Mood, regionId: RegionId): CanvasAction => {
  const region = state.regions[regionId];
  const weights = new Map<CanvasAction, number>(canvasActions.map((action) => [action, 0.2]));
  weights.set('pause_and_observe', 0.38);
  weights.set('stroke_line', 1);
  weights.set('wash_region', 0.9);
  weights.set('add_texture', 0.75);
  weights.set('darken_region', 0.55);
  weights.set('lighten_region', 0.5);
  weights.set('erase_region', 0.45);
  weights.set('scar_region', 0.35);
  weights.set('blur_region', 0.35);
  weights.set('pull_color', 0.25);
  weights.set('revisit_region', 0.25 + state.artistTaste.revisitBias);
  weights.set('interrupt_canvas', 0.12);

  if (region.density < 0.22) {
    weights.set('wash_region', 2.1);
    weights.set('stroke_line', 1.7);
    weights.set('add_texture', 1.3);
  }
  if (region.density > 0.74) {
    weights.set('erase_region', 2);
    weights.set('lighten_region', 1.6);
    weights.set('blur_region', 1.2);
    weights.set('scar_region', 1.1);
  }
  if (mood === 'frustrated') {
    weights.set('scar_region', 2.2);
    weights.set('erase_region', 1.8);
    weights.set('interrupt_canvas', 0.9);
  }
  if (mood === 'dreaming') {
    weights.set('wash_region', 1.8);
    weights.set('blur_region', 1.5);
    weights.set('pull_color', 1);
  }
  if (mood === 'obsessive') {
    weights.set('revisit_region', 2.4);
    weights.set('stroke_line', 1.3);
  }
  if (Math.random() < 0.13) weights.set('pause_and_observe', 2);

  const recent = state.recentActions.slice(0, 3);
  if (recent.length === 3 && recent.every((record) => record.action === recent[0].action && record.targetRegion === recent[0].targetRegion)) {
    weights.set(recent[0].action, mood === 'obsessive' ? 0.9 : 0.02);
  }

  return weightedPick([...weights.entries()].map(([value, weight]) => ({ value, weight })));
};

const chooseThought = (state: CanvasState, mood: Mood, action: CanvasAction, regionId: RegionId): string => {
  const region = state.regions[regionId];
  const place = regionId.replace('_', ' ');
  const contextual: string[] = [];
  if (region.density > 0.78) {
    contextual.push(`thin the ${place} before it goes muddy`, `lift weight from the ${place}`, `open the ${place} back up`);
  }
  if (region.density < 0.2) {
    contextual.push(`give the ${place} a reason to exist`, `start a small pressure point in the ${place}`, `wake up the empty ${place}`);
  }
  if (action === 'stroke_line') contextual.push(`draw a line to redirect the ${place}`, `anchor the ${place} with one firm stroke`);
  if (action === 'wash_region') contextual.push(`wash the ${place} so the old marks sink back`, `lay color over the ${place} without closing it`);
  if (action === 'erase_region') contextual.push(`erase the ${place} until the mistake shows`, `take back the ${place} but leave the trace`);
  if (action === 'blur_region') contextual.push(`blur the ${place} so the edge stops shouting`, `soften the ${place} without losing the structure`);
  if (action === 'scar_region') contextual.push(`scar the ${place} to interrupt the polish`, `score the ${place} so the layer underneath speaks`);
  if (action === 'darken_region') contextual.push(`darken the ${place} to pull the weight down`, `push shadow into the ${place} for resistance`);
  if (action === 'lighten_region') contextual.push(`lighten the ${place} so the canvas can breathe`, `thin the ${place} and let the ground show`);
  if (action === 'add_texture') contextual.push(`add grain to the ${place} so it catches`, `roughen the ${place} against the smoother fields`);
  if (action === 'pull_color') contextual.push(`pull color through the ${place} to tie the distance`, `drag the hue across the ${place} to disturb the balance`);
  if (action === 'revisit_region') contextual.push(`return to the ${place} because the first choice is weak`, `test the ${place} against the older marks`);
  if (action === 'interrupt_canvas') contextual.push('break the composition before it settles', 'force a rupture across the surface');
  if (action === 'pause_and_observe') contextual.push(`hold on the ${place} and see what is overworked`, `wait before adding more weight to the ${place}`);

  const recent = new Set(state.recentThoughts.slice(0, 10));
  const candidates = [...contextual, ...thoughtBank[mood]].filter((thought) => !recent.has(thought));
  return pick(candidates.length ? candidates : thoughtBank[mood]);
};

export const fallbackDirector = (state: CanvasState): ArtistCommand => {
  const mood = maybeShiftMood(state);
  const targetRegion = chooseRegion(state, mood);
  const action = chooseAction(state, mood, targetRegion);
  const region = state.regions[targetRegion];
  const secondaryRegion = action === 'pull_color' ? pick(neighbors[targetRegion]) : undefined;
  const intensityBase = 0.25 + Math.random() * 0.55;
  const densityPressure = region.density > 0.75 ? 0.12 : 0;
  const moodPressure = mood === 'frustrated' ? 0.18 : mood === 'calm' ? -0.08 : 0;

  return validateCommand({
    mood,
    thought: chooseThought(state, mood, action, targetRegion),
    action,
    targetRegion,
    intensity: intensityBase + densityPressure + moodPressure,
    durationMs: 2800 + Math.random() * (mood === 'calm' || mood === 'dreaming' ? 8200 : 6200),
    colorMood: pick(moodColors[mood]),
    secondaryRegion
  });
};
