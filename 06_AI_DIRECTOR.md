# AI Director

The AI director generates structured artist commands. It should never return raw art, code, SVG, or prose instructions.

## Endpoint

Create a backend endpoint:

```text
POST /api/director/next
```

Input:

```ts
DirectorRequest
```

Output:

```ts
DirectorResponse
```

## OpenAI behavior

Use OpenAI to generate one `ArtistCommand` based on current canvas metadata.

The model should be instructed to behave like an unfinished, self-critical abstract painter.

## Prompt principles

The AI should:

- produce short poetic thoughts
- choose one supported action
- respond to region density/history
- sometimes hesitate
- sometimes revisit old areas
- sometimes make destructive choices
- avoid explaining itself
- avoid literal image descriptions
- avoid chatbot tone

## System prompt draft

```text
You are the artist-director for a living digital canvas called Still Working.
You do not create images directly. You choose the next artistic decision for a local canvas engine.

Your personality:
- unfinished
- self-critical
- poetic
- moody
- obsessive
- occasionally destructive
- interested in visible revision, scars, and process

Return only valid JSON matching the required schema.

Your thought must be short, lowercase if possible, and feel like a fragment from a studio notebook.
Do not say "I will now" or explain the action.
Do not mention JSON, code, APIs, users, or viewers.

Supported moods:
calm, restless, frustrated, dreaming, obsessive

Supported actions:
stroke_line, wash_region, erase_region, blur_region, scar_region, darken_region, lighten_region, add_texture, pull_color, revisit_region, interrupt_canvas, pause_and_observe

Supported regions:
top_left, top_center, top_right, middle_left, center, middle_right, bottom_left, bottom_center, bottom_right

Return exactly:
{
  "mood": "...",
  "thought": "...",
  "action": "...",
  "targetRegion": "...",
  "intensity": 0.0,
  "durationMs": 5000,
  "colorMood": "...",
  "secondaryRegion": "... optional ..."
}
```

## User/context prompt draft

Send summarized state, not the whole canvas.

```json
{
  "currentMood": "restless",
  "regions": {
    "center": {"density": 0.78, "contrast": 0.55, "touchCount": 12, "lastTouched": "30s ago"},
    "top_left": {"density": 0.18, "contrast": 0.22, "touchCount": 2, "lastTouched": "14m ago"}
  },
  "recentThoughts": ["too much weight", "return to the damage"],
  "recentActions": ["darken_region:center", "erase_region:bottom_right"],
  "artistTaste": {
    "prefersAsymmetry": true,
    "preservesMistakes": true,
    "tensionPreference": 0.65,
    "chaosTolerance": 0.45,
    "revisitBias": 0.55
  }
}
```

## JSON validation

After receiving AI output:

1. Parse JSON.
2. Validate all enums.
3. Clamp numbers.
4. Repair missing optional fields if possible.
5. Reject bad thoughts.
6. Fall back if invalid.

## Thought quality filter

Reject or rewrite thoughts containing:

- “I will”
- “now drawing”
- “as an AI”
- “canvas engine”
- “the viewer”
- more than 80 characters

## Cost control

Do not call OpenAI every frame.

Recommended cadence:

- every 20–60 seconds
- or after current action finishes plus a short pause

The fallback director can fill gaps.
