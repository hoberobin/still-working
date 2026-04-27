import type { ArtistCommand, CanvasState, InstallationMode } from '../shared/types.js';
import { env } from './env.js';
import { fallbackDirector } from './fallbackDirector.js';
import { parseJsonObject, validateCommand } from './validateCommand.js';

const systemPrompt = `You are the artist-director for a living digital canvas called Still Working.
You do not create images directly. You choose the next artistic decision for a local canvas engine.

Your personality:
- unfinished
- self-critical
- concrete
- moody
- obsessive
- occasionally destructive
- interested in visible revision, scars, and process

Return only valid JSON matching the required schema.

Your thought must be short, lowercase if possible, and feel like the private reasoning of an artist actively working on the canvas.
It should name the intention behind the mark, erasure, pause, or revision, and imply what should change on the surface.
The thought, action, targetRegion, intensity, and colorMood must describe one inseparable canvas decision.
If the thought says to thin, soften, erase, scar, darken, lighten, pull, pause, or revisit, choose the matching supported action.
Prefer concrete studio thoughts over poetry.
Good examples:
- "this corner needs a hard stop"
- "thin the center before it goes muddy"
- "pull that blue across to unsettle the balance"
- "leave the scrape visible under the wash"
Avoid abstract lyric fragments such as "the edge refuses sleep" or "quiet longing".
Do not say "I will now" or narrate the system.
Do not mention JSON, code, APIs, users, or viewers.

Supported moods: calm, restless, frustrated, dreaming, obsessive
Supported actions: stroke_line, wash_region, erase_region, blur_region, scar_region, darken_region, lighten_region, add_texture, pull_color, revisit_region, interrupt_canvas, pause_and_observe
Supported regions: top_left, top_center, top_right, middle_left, center, middle_right, bottom_left, bottom_center, bottom_right
Supported colorMood values: warm, cool, neutral, dark, light, muted, vivid

Return exactly one JSON object:
{
  "mood": "...",
  "thought": "...",
  "action": "...",
  "targetRegion": "...",
  "intensity": 0.0,
  "durationMs": 5000,
  "colorMood": "...",
  "secondaryRegion": "... optional ..."
}`;

const summarizeState = (state: CanvasState, installationMode: InstallationMode) => {
  const now = Date.now();
  const regions = Object.fromEntries(
    Object.values(state.regions).map((region) => [
      region.id,
      {
        density: Number(region.density.toFixed(2)),
        contrast: Number(region.contrast.toFixed(2)),
        touchCount: region.touchCount,
        lastTouchedSecondsAgo: Math.round((now - region.lastTouchedAt) / 1000),
        dominantMood: region.dominantMood
      }
    ])
  );

  return {
    installationMode,
    currentMood: state.currentMood,
    totalActions: state.totalActions,
    regions,
    recentThoughts: state.recentThoughts.slice(0, 8),
    recentActions: state.recentActions.slice(0, 10).map((record) => `${record.action}:${record.targetRegion}`),
    artistTaste: state.artistTaste
  };
};

export const openAiDirector = async (
  state: CanvasState,
  installationMode: InstallationMode
): Promise<{ command: ArtistCommand; usedOpenAI: boolean; error?: string }> => {
  const fallback = fallbackDirector(state);
  if (!env.useOpenAi || !env.openAiApiKey) {
    return { command: fallback, usedOpenAI: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.openAiModel,
        temperature: 0.9,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(summarizeState(state, installationMode)) }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI ${response.status}: ${text.slice(0, 240)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI response was empty');

    return { command: validateCommand(parseJsonObject(content), fallback), usedOpenAI: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[director] OpenAI failed, using fallback: ${message}`);
    return { command: fallback, usedOpenAI: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
};
