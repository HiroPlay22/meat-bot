// bot/modules/gportal/queryServer.ts

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const gamedigQuery = require('gamedig');

import type { GportalServerConfig, LiveServerData } from './types.js';

/**
 * Führt einen Gamedig-Query aus.
 */
export async function queryServer(config: GportalServerConfig): Promise<LiveServerData | null> {
  if (!config.query) return null;

  try {
    const result = await gamedigQuery({
      type: config.type,
      host: config.host,
      port: config.queryPort,
    });

    const liveData: LiveServerData = {
      serverName: result.name ?? config.name,
      map: result.map,
      players: result.players.length,
      maxPlayers: result.maxplayers,
      ping: result.ping,
      version: result.raw?.version
    };

    return liveData;
  } catch (err) {
    console.warn(`[Query] Server ${config.name} nicht erreichbar:`, err);
    return null;
  }
}
