# Codex Build Prompt

Use this prompt when starting the implementation in Codex.

```text
You are building Still Working, a living AI-directed digital canvas installation.

Read all Markdown files in this project package before coding.

Build a local web app that runs on a laptop and can later run on a Raspberry Pi in Chromium kiosk mode. The app should show a split-screen interface: left side is the artist's mind, right side is an evolving abstract canvas.

Core rule: the AI does not generate images. The AI only returns structured artist commands. The local canvas engine performs animated painterly actions.

Required features:
- Vite + TypeScript frontend
- Node/Express backend
- OpenAI API integration through backend only
- `.env` support with OPENAI_API_KEY
- local fallback director when OpenAI is unavailable
- p5.js or Canvas-based painting engine
- split-screen UI
- thought panel with current and fading previous thoughts
- mood/state system
- 3x3 region grid metadata
- action queue
- animated canvas actions
- JSON state persistence
- validation of AI command schema
- debug mode via query param

Implement at least these actions first:
- stroke_line
- wash_region
- erase_region
- scar_region
- darken_region
- lighten_region
- add_texture
- pause_and_observe

Then implement if time allows:
- blur_region
- pull_color
- revisit_region
- interrupt_canvas

The app must run even without an OpenAI API key.

Do not build a chat UI, dashboard, user accounts, or settings-heavy interface.

Prioritize a beautiful, alive-feeling installation over feature breadth.

After implementation, provide setup instructions and list any incomplete items.
```
