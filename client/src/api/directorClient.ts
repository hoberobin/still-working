import type { ActionCompletedRequest, CanvasState, DirectorResponse, InstallationMode } from '../../../shared/types';

export interface RuntimeConfig {
  installationMode: InstallationMode;
  directorIntervalMinMs: number;
  directorIntervalMaxMs: number;
  openAiConfigured: boolean;
}

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json() as Promise<T>;
};

export const getState = (): Promise<CanvasState> => requestJson<CanvasState>('/api/state');

export const getRuntime = (): Promise<RuntimeConfig> => requestJson<RuntimeConfig>('/api/runtime');

export const getNextCommand = (
  canvasState: CanvasState,
  installationMode: InstallationMode
): Promise<DirectorResponse> =>
  requestJson<DirectorResponse>('/api/director/next', {
    method: 'POST',
    body: JSON.stringify({ canvasState, installationMode })
  });

export const completeAction = (payload: ActionCompletedRequest): Promise<CanvasState> =>
  requestJson<CanvasState>('/api/state/action-completed', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
