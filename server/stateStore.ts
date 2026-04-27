import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ActionCompletedRequest, ActionRecord, CanvasState, RegionId } from '../shared/types.js';
import { createInitialRegions } from './regions.js';
import { validateCommand } from './validateCommand.js';

const dataDir = path.join(process.cwd(), 'data');
const statePath = path.join(dataDir, 'state.json');
const historyPath = path.join(dataDir, 'action-history.json');

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const storedThoughtRewrites = [
  'thin the center before it goes muddy',
  'leave the scrape visible under the wash',
  'return here and test the old decision',
  'soften the edge without losing the structure',
  'give this empty area a reason to exist',
  'break the composition before it settles',
  'pull color across to disturb the balance',
  'roughen the clean area so it catches',
  'take back the mark but leave the trace',
  'darken this corner to shift the weight',
  'hold still and find what is overworked',
  'wash over the line without hiding it',
  'score the surface so the layer below speaks',
  'open this crowded area back up',
  'anchor the edge with one firm stroke',
  'move the eye out of its usual path',
  'let the ground show through the revision',
  'test the old mark against the new layer',
  'make the correction visible',
  'add pressure where the surface goes slack'
];

const rewriteStoredThought = (thought: unknown, index: number): string => {
  if (typeof thought !== 'string') return storedThoughtRewrites[index % storedThoughtRewrites.length];
  const lower = thought.toLowerCase();
  const soundsPoetic =
    lower.includes('longing') ||
    lower.includes('refuses sleep') ||
    lower.includes('wound') ||
    lower.includes('ache') ||
    lower.includes('hazy') ||
    lower.includes('memory') ||
    lower.includes('forgot') ||
    lower.includes('speaking') ||
    lower.includes('hums') ||
    lower.includes('pulses') ||
    lower.includes('starved') ||
    lower.includes('quiet') ||
    lower.includes('...');
  return soundsPoetic ? storedThoughtRewrites[index % storedThoughtRewrites.length] : thought;
};

export const createInitialState = (): CanvasState => {
  const now = Date.now();
  return {
    currentMood: 'calm',
    regions: createInitialRegions(),
    recentActions: [],
    recentThoughts: [],
    artistTaste: {
      prefersAsymmetry: true,
      preservesMistakes: true,
      avoidsPerfectShapes: true,
      likesVisibleLayers: true,
      tensionPreference: 0.55,
      chaosTolerance: 0.35,
      revisitBias: 0.45
    },
    totalActions: 0,
    startedAt: now,
    lastCommandAt: 0
  };
};

export class StateStore {
  private state: CanvasState | null = null;

  async load(): Promise<CanvasState> {
    if (this.state) return this.state;
    await mkdir(dataDir, { recursive: true });
    try {
      const raw = await readFile(statePath, 'utf8');
      this.state = this.repairState(JSON.parse(raw));
    } catch {
      this.state = createInitialState();
      await this.persist();
    }
    return this.state;
  }

  async get(): Promise<CanvasState> {
    return this.load();
  }

  async markCommandIssued(): Promise<void> {
    const state = await this.load();
    state.lastCommandAt = Date.now();
    await this.persist();
  }

  async completeAction(request: ActionCompletedRequest): Promise<CanvasState> {
    const state = await this.load();
    const command = validateCommand(request.command);
    const now = Date.now();
    const record: ActionRecord = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now,
      mood: command.mood,
      thought: command.thought,
      action: command.action,
      targetRegion: command.targetRegion,
      intensity: command.intensity,
      durationMs: command.durationMs
    };

    state.currentMood = command.mood;
    state.totalActions += 1;
    state.lastCommandAt = now;
    state.recentActions = [record, ...state.recentActions].slice(0, 50);
    state.recentThoughts = [command.thought, ...state.recentThoughts.filter((item) => item !== command.thought)].slice(0, 20);

    this.updateRegion(state, command.targetRegion, command, request.regionUpdates?.[command.targetRegion]);
    if (command.secondaryRegion && command.secondaryRegion !== command.targetRegion) {
      this.updateRegion(state, command.secondaryRegion, command, request.regionUpdates?.[command.secondaryRegion], 0.45);
    }

    if (state.totalActions % (20 + Math.floor(Math.random() * 31)) === 0) {
      const key = Math.random() > 0.5 ? 'chaosTolerance' : Math.random() > 0.5 ? 'revisitBias' : 'tensionPreference';
      state.artistTaste[key] = clamp01(state.artistTaste[key] + (Math.random() - 0.5) * 0.08);
    }

    await this.persist();
    await writeFile(historyPath, JSON.stringify(state.recentActions, null, 2));
    return state;
  }

  private updateRegion(
    state: CanvasState,
    regionId: RegionId,
    command: ReturnType<typeof validateCommand>,
    clientUpdate?: Partial<{ density: number; contrast: number }>,
    multiplier = 1
  ): void {
    const region = state.regions[regionId];
    const intensity = command.intensity * multiplier;
    const densityDelta: Record<string, number> = {
      stroke_line: 0.06,
      wash_region: 0.09,
      erase_region: -0.16,
      blur_region: -0.03,
      scar_region: 0.08,
      darken_region: 0.08,
      lighten_region: -0.07,
      add_texture: 0.05,
      pull_color: 0.07,
      revisit_region: 0.04,
      interrupt_canvas: 0.1,
      pause_and_observe: 0
    };
    const contrastDelta: Record<string, number> = {
      stroke_line: 0.05,
      wash_region: 0.02,
      erase_region: -0.08,
      blur_region: -0.06,
      scar_region: 0.16,
      darken_region: 0.1,
      lighten_region: -0.1,
      add_texture: 0.04,
      pull_color: 0.04,
      revisit_region: 0.04,
      interrupt_canvas: 0.18,
      pause_and_observe: 0
    };

    region.density = clamp01(clientUpdate?.density ?? region.density + (densityDelta[command.action] ?? 0) * intensity);
    region.contrast = clamp01(clientUpdate?.contrast ?? region.contrast + (contrastDelta[command.action] ?? 0) * intensity);
    region.lastTouchedAt = Date.now();
    region.touchCount += command.action === 'pause_and_observe' ? 0 : 1;
    region.dominantMood = command.mood;
  }

  private repairState(raw: CanvasState): CanvasState {
    const initial = createInitialState();
    return {
      ...initial,
      ...raw,
      regions: { ...initial.regions, ...(raw.regions ?? {}) },
      recentActions: Array.isArray(raw.recentActions) ? raw.recentActions.slice(0, 50) : [],
      recentThoughts: Array.isArray(raw.recentThoughts)
        ? raw.recentThoughts.slice(0, 20).map((thought, index) => rewriteStoredThought(thought, index))
        : [],
      artistTaste: { ...initial.artistTaste, ...(raw.artistTaste ?? {}) }
    };
  }

  private async persist(): Promise<void> {
    if (!this.state) return;
    await mkdir(dataDir, { recursive: true });
    await writeFile(statePath, JSON.stringify(this.state, null, 2));
  }
}
