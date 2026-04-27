# Data Contracts

This project depends on strict structured data. The AI should never return freeform instructions that the renderer has to guess how to interpret.

## ArtistCommand

The AI director and fallback director both return this object.

```ts
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

export interface ArtistCommand {
  mood: Mood;
  thought: string;
  action: CanvasAction;
  targetRegion: RegionId;
  intensity: number; // 0 to 1
  durationMs: number; // 2000 to 12000
  colorMood?: 'warm' | 'cool' | 'neutral' | 'dark' | 'light' | 'muted' | 'vivid';
  secondaryRegion?: RegionId;
}
```

## Validation rules

Reject or repair commands that violate these rules:

- `thought` must be 3 to 80 characters.
- `thought` should not include explanatory phrases like “I will now”.
- `intensity` must be clamped between 0 and 1.
- `durationMs` must be clamped between 2000 and 12000.
- `action` must be one of the supported action names.
- `targetRegion` must be one of the 9 grid regions.
- `pull_color` should include `secondaryRegion`; if missing, choose a neighboring region.
- `pause_and_observe` should not visibly alter the canvas.

## CanvasState

```ts
export interface RegionState {
  id: RegionId;
  x: number; // normalized 0 to 1
  y: number;
  w: number;
  h: number;
  density: number; // 0 to 1
  contrast: number; // 0 to 1
  lastTouchedAt: number; // epoch ms
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
  tensionPreference: number; // 0 to 1
  chaosTolerance: number; // 0 to 1
  revisitBias: number; // 0 to 1
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
```

## DirectorRequest

```ts
export interface DirectorRequest {
  canvasState: CanvasState;
  installationMode: 'studio' | 'restless' | 'dream' | 'brutalist' | 'memory';
}
```

## DirectorResponse

```ts
export interface DirectorResponse {
  command: ArtistCommand;
  source: 'openai' | 'fallback';
}
```
