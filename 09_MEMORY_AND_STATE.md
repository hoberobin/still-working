# Memory and State

Memory is what prevents this from feeling random.

The system should remember what it has done and use that memory to shape future actions.

## Storage approach

For MVP, use local JSON files.

Suggested files:

```text
data/state.json
data/action-history.json
data/settings.json
```

## What to persist

Persist:

- current mood
- total action count
- recent thoughts
- recent actions
- region metadata
- artist taste profile
- installation mode
- start time / last run time

Do not attempt to persist the full pixel canvas in MVP unless easy. The visual canvas can restart while the artist memory persists.

Optional later: save periodic canvas snapshots.

## Region memory

Each region tracks:

- density
- contrast
- last touched time
- touch count
- dominant mood

Use this for AI summaries and fallback decisions.

## Recent action memory

Keep at least the last 50 actions.

Use recent memory to:

- avoid repetition
- allow revisiting
- generate better context for AI
- create the feeling of obsession or regret

## Artist taste drift

The artist should slowly evolve.

Taste values:

- `tensionPreference`
- `chaosTolerance`
- `revisitBias`

Every 20–50 actions, slightly adjust one taste value by a small amount.

Clamp values between 0 and 1.

This lets the piece change over days without becoming chaotic.

## Memory-based behaviors

Examples:

- If center has been touched repeatedly, the artist may become obsessive or frustrated.
- If a region has been ignored for a long time, the artist may call it quiet or neglected.
- If a region was recently erased, the artist may return to “the damage.”
- If high density accumulates, the artist may lighten, erase, or scar it.

## State update after each action

After an action completes:

1. Add record to recent actions.
2. Add thought to recent thoughts.
3. Update target region stats.
4. Update total action count.
5. Possibly update mood.
6. Possibly drift artist taste.
7. Persist state.

## Default initial state

Start with:

- mood: calm
- all regions density: 0.05–0.15
- all regions contrast: 0.05–0.15
- artist taste:
  - prefersAsymmetry: true
  - preservesMistakes: true
  - avoidsPerfectShapes: true
  - likesVisibleLayers: true
  - tensionPreference: 0.55
  - chaosTolerance: 0.35
  - revisitBias: 0.45
