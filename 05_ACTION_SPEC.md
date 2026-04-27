# Action Spec

Each action must be implemented as an animated visual operation.

All actions receive an `ArtistCommand`.

## Shared parameters

- `targetRegion`: where the action focuses.
- `intensity`: strength from 0 to 1.
- `durationMs`: animation duration.
- `colorMood`: optional palette guidance.
- `secondaryRegion`: optional second region for actions like pulling color.

## 1. stroke_line

Draws an imperfect painterly line through or near the target region.

Behavior:

- choose start/end points near target region
- add jitter/noise
- draw progressively over duration
- use alpha and thickness based on intensity

Visual goal: a hand-made mark, not a perfect vector line.

## 2. wash_region

Adds a translucent color field over a region.

Behavior:

- softly fill irregular blob(s)
- opacity grows slowly
- edges should be imperfect/noisy
- may bleed outside region

Visual goal: watercolor/acrylic wash.

## 3. erase_region

Removes or fades visual material in a region.

Behavior:

- use soft irregular eraser passes
- leave ghost marks unless intensity is very high
- update density downward

Visual goal: revision, not deletion.

## 4. blur_region

Softens a target region.

Behavior:

- approximate blur via translucent overlays, pixel sampling, or p5 filter on offscreen region
- animate blur strength over time

Visual goal: uncertainty, memory, softening.

## 5. scar_region

Adds harsh scratches, cuts, or pressure marks.

Behavior:

- short jagged lines
- higher contrast
- quick/staccato animation
- density and contrast increase

Visual goal: frustration or damage.

## 6. darken_region

Adds visual weight.

Behavior:

- translucent dark overlays
- clustered strokes
- may add shadow-like texture

Visual goal: heaviness, tension.

## 7. lighten_region

Creates visual breathing room.

Behavior:

- soft light wash
- reduce contrast slightly
- should not fully erase

Visual goal: space, quiet, air.

## 8. add_texture

Adds grain, speckles, canvas texture, or subtle noise.

Behavior:

- scatter small marks in target region
- amount based on intensity
- low opacity

Visual goal: physical surface.

## 9. pull_color

Smears or drags color from one area toward another.

Behavior:

- sample dominant color impression if possible, or choose from palette
- create repeated semi-transparent strokes from target to secondary region
- direction matters

Visual goal: color migration.

## 10. revisit_region

Returns to a previously touched region and performs a smaller action.

Behavior:

- select region with old history or high touch count
- choose one sub-action internally: stroke, wash, darken, scar, blur
- thought should often reference return/memory/damage

Visual goal: obsession or memory.

## 11. interrupt_canvas

A dramatic disruptive gesture.

Behavior:

- may cut across multiple regions
- can briefly override action queue
- should be visually strong but not constant

Visual goal: rupture.

## 12. pause_and_observe

The artist thinks but does not paint.

Behavior:

- no canvas mutation beyond subtle pulse
- thought appears
- optional tiny breathing animation

Visual goal: hesitation.

## Required first implementation subset

If time is limited, implement these first:

1. stroke_line
2. wash_region
3. erase_region
4. scar_region
5. darken_region
6. lighten_region
7. add_texture
8. pause_and_observe

Then add blur, pull_color, revisit, and interrupt.
