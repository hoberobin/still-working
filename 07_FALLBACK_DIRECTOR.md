# Fallback Director

The piece must keep living without OpenAI.

The fallback director is a local rule-based artist that returns the same `ArtistCommand` schema as the AI director.

## Responsibilities

- continue painting if OpenAI key is missing
- continue painting if API request fails
- generate decent thoughts locally
- avoid repetitive behavior
- respect mood, memory, and region metadata

## Fallback selection logic

Weighted rules:

- If one region has very low density, consider `wash_region`, `stroke_line`, or `add_texture`.
- If one region has very high density, consider `erase_region`, `lighten_region`, or `blur_region`.
- If current mood is frustrated, increase `scar_region`, `erase_region`, `interrupt_canvas`.
- If current mood is dreaming, increase `wash_region`, `blur_region`, `pull_color`.
- If current mood is obsessive, increase `revisit_region` and repeated target regions.
- Occasionally choose `pause_and_observe`.

## Mood transitions

Suggested probabilities after each action:

- calm → dreaming/restless
- restless → calm/frustrated/obsessive
- frustrated → calm/restless
- dreaming → calm/obsessive
- obsessive → frustrated/dreaming/calm

Mood should not change every action. Let moods persist for several commands.

## Local thought templates

Use fragments, not explanations.

### Calm

- let this breathe
- softer here
- hold the quiet
- not everything needs weight

### Restless

- too settled
- move before it hardens
- something is stuck
- disturb the balance

### Frustrated

- no. remove it
- too clean
- cut through it
- this is pretending

### Dreaming

- almost a memory
- let it drift
- blur the edge
- less certain

### Obsessive

- back here again
- return to the damage
- the first mark is still speaking
- not done with this corner

## Repetition control

Avoid repeating the exact same thought within the last 10 thoughts.

Avoid using the exact same action and region more than 3 times in a row unless mood is obsessive.

## Fallback response example

```json
{
  "mood": "dreaming",
  "thought": "less certain",
  "action": "blur_region",
  "targetRegion": "top_center",
  "intensity": 0.42,
  "durationMs": 8000,
  "colorMood": "muted"
}
```
