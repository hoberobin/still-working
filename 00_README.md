# Still Working — Codex Build Package

Still Working is a living digital wall art piece: an AI-directed painter that continuously thinks, paints, revises, erases, hesitates, and reworks an abstract canvas.

The goal is not to generate a finished AI image. The goal is to watch an artificial artist stay in process forever.

## Ideal first-run outcome

1. Clone/open the project.
2. Add `OPENAI_API_KEY` to `.env`.
3. Run the local app.
4. A browser opens showing a split-screen installation:
   - Left: the artist's mind.
   - Right: the evolving canvas.
5. The artist produces short thoughts and visible painting actions.
6. If OpenAI fails or no key is present, the local fallback artist keeps painting.

## Core rule

The AI does not directly render images.

The AI acts as the artist-director. It returns structured decisions such as mood, thought, action, region, intensity, and duration. The local canvas engine performs the painting.

## Recommended build order

1. Read `01_PRODUCT_CONCEPT.md`.
2. Build from `02_IMPLEMENTATION_PLAN.md`.
3. Implement schemas from `03_DATA_CONTRACTS.md`.
4. Implement canvas actions from `04_CANVAS_ENGINE.md` and `05_ACTION_SPEC.md`.
5. Add the artist director from `06_AI_DIRECTOR.md` and fallback from `07_FALLBACK_DIRECTOR.md`.
6. Add UI from `08_INTERFACE_AND_VISUAL_LANGUAGE.md`.
7. Add memory from `09_MEMORY_AND_STATE.md`.
8. Validate with `12_TEST_SCENARIOS.md`.
9. Deploy to Raspberry Pi using `13_RASPBERRY_PI_DEPLOYMENT.md`.

## Non-negotiables

- No chat UI.
- No dashboard.
- No instant image generation loop.
- Thoughts must be short, poetic, and process-oriented.
- Actions must visibly animate over time.
- The piece must continue running without OpenAI.
- The canvas should accumulate history, scars, and revisions.
