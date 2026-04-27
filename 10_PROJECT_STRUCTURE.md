# Project Structure

Recommended repository structure:

```text
still-working/
  package.json
  .env.example
  README.md
  server/
    index.ts
    openaiDirector.ts
    fallbackDirector.ts
    validateCommand.ts
    stateStore.ts
    types.ts
  client/
    index.html
    src/
      main.ts
      app.ts
      canvas/
        CanvasEngine.ts
        actions/
          strokeLine.ts
          washRegion.ts
          eraseRegion.ts
          blurRegion.ts
          scarRegion.ts
          darkenRegion.ts
          lightenRegion.ts
          addTexture.ts
          pullColor.ts
          revisitRegion.ts
          interruptCanvas.ts
          pauseAndObserve.ts
        regions.ts
        palettes.ts
        pulse.ts
      mind/
        MindPanel.ts
        thoughtHistory.ts
      api/
        directorClient.ts
      styles.css
  data/
    state.json
    action-history.json
  docs/
    copied-md-specs-here
```

## Simpler alternative

If Codex prefers a single Vite app with API routes, that is acceptable. Keep the same conceptual modules.

## Required scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx server/index.ts",
    "dev:client": "vite client --host 0.0.0.0",
    "build": "vite build client",
    "start": "node dist/server/index.js"
  }
}
```

Adjust build details as needed.

## Environment variables

`.env.example`:

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
PORT=3000
DIRECTOR_INTERVAL_MIN_MS=20000
DIRECTOR_INTERVAL_MAX_MS=60000
INSTALLATION_MODE=studio
USE_OPENAI=true
```

If `OPENAI_API_KEY` is missing, default to fallback director.
