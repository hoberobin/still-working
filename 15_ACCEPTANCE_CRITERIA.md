# Acceptance Criteria

The project is acceptable when all of the following are true.

## App startup

- `npm install` works.
- `.env.example` exists.
- App can run locally.
- App works without `OPENAI_API_KEY`.
- App uses OpenAI when `OPENAI_API_KEY` is provided and `USE_OPENAI=true`.

## Interface

- Split-screen layout exists.
- Left side shows current thought and previous fading thoughts.
- Right side shows evolving abstract canvas.
- No chat UI is present.
- No dashboard UI is present by default.

## Canvas

- At least 8 actions are implemented.
- Actions animate over time.
- Canvas accumulates visible history.
- Erasures leave some trace unless very intense.
- The canvas does not fully clear every frame.

## AI director

- Backend calls OpenAI, not frontend.
- AI returns structured JSON.
- Response is validated.
- Invalid responses trigger fallback.
- Thoughts are short and not explanatory.

## Fallback director

- Fallback produces valid commands.
- Fallback avoids obvious repetition.
- Fallback respects mood and region metadata.

## Memory

- State persists to local JSON.
- Recent actions are stored.
- Recent thoughts are stored.
- Region metadata updates after actions.

## Raspberry Pi readiness

- Deployment instructions exist.
- Kiosk mode command is documented.
- App can be served locally.

## Art quality

- The piece feels alive within 2–3 minutes of viewing.
- The thought-action relationship is understandable.
- The system sometimes pauses or hesitates.
- The system sometimes revises or erases its own work.
