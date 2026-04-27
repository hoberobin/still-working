export type Mood = 'calm' | 'restless' | 'frustrated' | 'dreaming' | 'obsessive';

export type CanvasAction =
  | 'stroke_line'
  | 'wash_region'
  | 'erase_region'
  | 'blur_region'
  | 'scar_region'
  | 'darken_region'
  | 'lighten_region'
  | 'add_texture'
  | 'pull_color'
  | 'revisit_region'
  | 'interrupt_canvas'
  | 'pause_and_observe';

export type RegionId =
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'middle_left'
  | 'center'
  | 'middle_right'
  | 'bottom_left'
  | 'bottom_center'
  | 'bottom_right';

export type ColorMood = 'warm' | 'cool' | 'neutral' | 'dark' | 'light' | 'muted' | 'vivid';

export interface ArtistCommand {
  mood: Mood;
  thought: string;
  action: CanvasAction;
  targetRegion: RegionId;
  intensity: number;
  durationMs: number;
  colorMood?: ColorMood;
  secondaryRegion?: RegionId;
}

export interface RegionState {
  id: RegionId;
  x: number;
  y: number;
  w: number;
  h: number;
  density: number;
  contrast: number;
  lastTouchedAt: number;
  touchCount: number;
  dominantMood?: Mood;
}

export interface ActionRecord {
  id: string;
  timestamp: number;
  mood: Mood;
  thought: string;
  action: CanvasAction;
  targetRegion: RegionId;
  intensity: number;
  durationMs: number;
}

export interface ArtistTaste {
  prefersAsymmetry: boolean;
  preservesMistakes: boolean;
  avoidsPerfectShapes: boolean;
  likesVisibleLayers: boolean;
  tensionPreference: number;
  chaosTolerance: number;
  revisitBias: number;
}

export interface CanvasState {
  currentMood: Mood;
  regions: Record<RegionId, RegionState>;
  recentActions: ActionRecord[];
  recentThoughts: string[];
  artistTaste: ArtistTaste;
  totalActions: number;
  startedAt: number;
  lastCommandAt: number;
}

export type InstallationMode = 'studio' | 'restless' | 'dream' | 'brutalist' | 'memory';

export interface DirectorRequest {
  canvasState: CanvasState;
  installationMode: InstallationMode;
}

export interface DirectorResponse {
  command: ArtistCommand;
  source: 'openai' | 'fallback';
}

export interface ActionCompletedRequest {
  command: ArtistCommand;
  regionUpdates?: Partial<Record<RegionId, Partial<Pick<RegionState, 'density' | 'contrast'>>>>;
}

export const moods: Mood[] = ['calm', 'restless', 'frustrated', 'dreaming', 'obsessive'];

export const canvasActions: CanvasAction[] = [
  'stroke_line',
  'wash_region',
  'erase_region',
  'blur_region',
  'scar_region',
  'darken_region',
  'lighten_region',
  'add_texture',
  'pull_color',
  'revisit_region',
  'interrupt_canvas',
  'pause_and_observe'
];

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

export const colorMoods: ColorMood[] = ['warm', 'cool', 'neutral', 'dark', 'light', 'muted', 'vivid'];
