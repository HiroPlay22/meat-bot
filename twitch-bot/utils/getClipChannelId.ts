import fs from 'fs';
import path from 'path';

export function getClipChannelId(): string | null {
  const configPath = path.resolve(process.cwd(), 'config/serverSettings.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(raw);

  // Hier kannst du auch dynamisch die Guild-ID laden – vorerst hart:
  const guildId = '271568768268894218';

  return config.guilds?.[guildId]?.clipChannelId ?? null;
}
