import dotenv from 'dotenv';

dotenv.config();

const numberFromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

export const env = {
  port: numberFromEnv('PORT', 3000),
  openAiApiKey: process.env.OPENAI_API_KEY?.trim() ?? '',
  openAiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini',
  useOpenAi: (process.env.USE_OPENAI ?? 'true').toLowerCase() !== 'false',
  installationMode: process.env.INSTALLATION_MODE?.trim() || 'studio',
  directorIntervalMinMs: numberFromEnv('DIRECTOR_INTERVAL_MIN_MS', 20000),
  directorIntervalMaxMs: numberFromEnv('DIRECTOR_INTERVAL_MAX_MS', 60000)
};
