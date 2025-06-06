import path from 'path';
import { readFileSync } from 'fs';
import type { GportalServerConfig } from './types.js';

const settingsPath = path.resolve(__dirname, '../../config/gportalSettings.json');

export function loadGportalSettings(): GportalServerConfig[] {
  const raw = readFileSync(settingsPath, 'utf-8');
  const servers = JSON.parse(raw) as GportalServerConfig[];

  // optional: validieren
  return servers.filter(s => s.display);
}

export function getServerById(id: string): GportalServerConfig | undefined {
  return loadGportalSettings().find(s => s.id === id);
}
