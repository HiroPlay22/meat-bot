import { fileURLToPath } from 'url';
import path from 'path';
import { readFileSync } from 'fs';
import type { GportalServerConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const settingsPath = path.resolve(__dirname, '../../config/gportalSettings.json');

export function loadGportalSettings(): GportalServerConfig[] {
  const raw = readFileSync(settingsPath, 'utf-8');
  const servers = JSON.parse(raw) as GportalServerConfig[];

  // optional: validieren oder loggen
  return servers.filter((s) => s.display);
}

export function getServerById(id: string): GportalServerConfig | undefined {
  return loadGportalSettings().find((s) => s.id === id);
}
