import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ActionCompletedRequest, DirectorRequest, InstallationMode } from '../shared/types.js';
import { env } from './env.js';
import { openAiDirector } from './openaiDirector.js';
import { StateStore } from './stateStore.js';
import { validateCommand } from './validateCommand.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const store = new StateStore();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/state', async (_request, response, next) => {
  try {
    response.json(await store.get());
  } catch (error) {
    next(error);
  }
});

app.get('/api/runtime', (_request, response) => {
  response.json({
    installationMode: env.installationMode,
    directorIntervalMinMs: env.directorIntervalMinMs,
    directorIntervalMaxMs: env.directorIntervalMaxMs,
    openAiConfigured: Boolean(env.openAiApiKey && env.useOpenAi)
  });
});

app.post('/api/director/next', async (request, response, next) => {
  try {
    const body = request.body as Partial<DirectorRequest>;
    const state = body.canvasState ?? (await store.get());
    const installationMode = ((body.installationMode ?? env.installationMode) || 'studio') as InstallationMode;
    const result = await openAiDirector(state, installationMode);
    await store.markCommandIssued();
    response.json({
      command: validateCommand(result.command),
      source: result.usedOpenAI ? 'openai' : 'fallback'
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/state/action-completed', async (request, response, next) => {
  try {
    const state = await store.completeAction(request.body as ActionCompletedRequest);
    response.json(state);
  } catch (error) {
    next(error);
  }
});

const staticDir = path.resolve(__dirname, '../client');
app.use(express.static(staticDir));
app.get('*', (_request, response, next) => {
  if (_request.path.startsWith('/api/')) return next();
  response.sendFile(path.join(staticDir, 'index.html'));
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unknown server error';
  console.error(message);
  response.status(500).json({ error: message });
});

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Still Working listening on http://localhost:${env.port}`);
});
