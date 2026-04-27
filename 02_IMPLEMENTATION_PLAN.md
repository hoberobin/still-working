# Implementation Plan

## Target architecture

Use a local web app that can run on a laptop during development and on Raspberry Pi in kiosk mode.

Recommended stack:

- Frontend: Vite + TypeScript + p5.js or Canvas API
- Backend: Node.js + Express
- AI: OpenAI API via server endpoint
- Storage: local JSON files for MVP
- Runtime display: Chromium fullscreen/kiosk on Raspberry Pi

## Development phases

### Phase 1 — Local app shell

Create:

- Vite frontend
- Express backend
- shared TypeScript types if convenient
- `.env` support
- local dev command
- production build command

Expected result: app loads in browser with split layout.

### Phase 2 — Canvas engine

Implement:

- persistent canvas
- render loop at approximately 30 FPS
- action queue
- animated action execution
- region grid metadata

Expected result: hardcoded actions can animate on the canvas.

### Phase 3 — Thought panel

Implement:

- current thought display
- previous thoughts fading downward/upward
- mood label
- subtle pulse indicator

Expected result: manually triggered actions show thought and matching canvas action.

### Phase 4 — Local fallback director

Implement:

- rule-based command generation
- weighted action selection
- local thought templates
- mood shifts

Expected result: artwork keeps evolving without OpenAI key.

### Phase 5 — OpenAI director

Implement:

- backend `/api/director/next` endpoint
- sends current state summary to OpenAI
- validates structured JSON response
- falls back locally on failure

Expected result: OpenAI produces structured artist decisions.

### Phase 6 — Memory/state persistence

Implement:

- JSON persistence for recent thoughts/actions
- region stats
- current mood
- artist taste drift
- optional save/load canvas metadata

Expected result: system has continuity across time and can revisit prior areas.

### Phase 7 — Pi deployment

Implement or document:

- production build
- start script
- Chromium kiosk mode
- systemd service or autostart

Expected result: Pi boots into the artwork.

## MVP completion definition

The project is ready when:

- running locally requires only `npm install`, `.env`, and `npm run dev`
- without API key, fallback painter works
- with API key, OpenAI-directed thoughts/actions work
- at least 8 canvas actions are visually implemented
- actions animate rather than instantly appearing
- state/memory updates after each action
- Pi deployment instructions are clear
