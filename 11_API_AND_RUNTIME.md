# API and Runtime

## Backend endpoints

### GET /api/state

Returns current `CanvasState`.

### POST /api/director/next

Returns next artist command.

Request:

```json
{
  "canvasState": {},
  "installationMode": "studio"
}
```

Response:

```json
{
  "command": {
    "mood": "restless",
    "thought": "too settled",
    "action": "scar_region",
    "targetRegion": "center",
    "intensity": 0.61,
    "durationMs": 6000,
    "colorMood": "dark"
  },
  "source": "openai"
}
```

### POST /api/state/action-completed

Frontend calls this after an action completes so backend can persist memory.

Request:

```json
{
  "command": {},
  "regionUpdates": {}
}
```

## Runtime cadence

Frontend owns the visual loop.

Suggested cadence:

1. On load, fetch `/api/state`.
2. Start canvas render loop.
3. Request first command from `/api/director/next`.
4. Execute command.
5. Notify backend when complete.
6. Wait a random delay between 3–15 seconds.
7. Request next command.

OpenAI should not be called directly from the browser.

## Timing defaults

- render loop: 30 FPS
- command interval: 20–60 seconds including action duration and pauses
- action duration: 2–12 seconds
- thought fade duration: 30–120 seconds
- idle pause chance: 10–20%

## Debug mode

Add optional `?debug=true` query parameter.

Debug mode may show:

- current command JSON
- region grid overlay
- source openai/fallback
- action queue length

Debug mode should be off by default.
