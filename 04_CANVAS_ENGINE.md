# Canvas Engine

The canvas engine turns structured artist commands into visible animated painterly changes.

## Responsibilities

The canvas engine must:

- maintain the visible artwork
- execute one or more active animations
- mutate metadata in `CanvasState`
- preserve visual history
- support region-based targeting
- avoid instant, jarring changes unless the action intentionally calls for interruption

## Rendering approach

Use p5.js or Canvas API.

Recommended p5.js layers:

- `baseLayer`: long-lived painting surface
- `workingLayer`: active animated strokes/effects
- `textureLayer`: subtle grain/noise
- `display`: composite output

The artwork should not clear every frame. The painting must accumulate.

## Frame loop

- Target: 30 FPS.
- Each frame:
  1. Update active action animations.
  2. Composite layers.
  3. Apply subtle global pulse if desired.
  4. Render final canvas.

## Action queue

Maintain an action queue.

```ts
interface RunningAction {
  id: string;
  command: ArtistCommand;
  startedAt: number;
  durationMs: number;
  progress: number; // 0 to 1
}
```

Rules:

- Usually run one main action at a time.
- Allow ambient texture/pulse effects concurrently.
- If a new command arrives while an action is running, queue it unless action is `interrupt_canvas`.
- `interrupt_canvas` may cancel or visually override current action.

## Region targeting

Use a 3x3 grid:

```text
top_left       top_center       top_right
middle_left    center           middle_right
bottom_left    bottom_center    bottom_right
```

Each region maps to normalized bounds and real pixel bounds.

Actions should be region-aware but not perfectly bounded. Painterly actions may bleed outside a target region slightly.

## Animation requirement

Every visual action should visibly unfold.

Examples:

- strokes draw from start to end over time
- washes spread gradually
- erasures scrape/fade over time
- blurs ease in/out
- textures accumulate in small passes

Avoid applying an entire action in a single frame.

## Visual history

The painting should keep scars and traces.

Even erase actions should usually leave faint history unless intensity is very high.

Suggested erase behavior:

- low intensity: reduce alpha/contrast by 10–25%
- medium: reduce by 25–60%
- high: reduce by 60–90%, but leave ghosting/noise

## Pulse

The pulse is a subtle global rhythm that makes the piece feel alive.

Pulse can affect:

- brightness
- opacity multiplier
- line jitter
- thought panel indicator
- action cadence

Mood affects pulse speed:

- calm: slow, steady
- restless: quicker, uneven
- frustrated: sharp/stuttered
- dreaming: slow wave
- obsessive: repetitive, narrow
