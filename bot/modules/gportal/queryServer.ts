// bot/modules/gportal/queryServer.ts

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { query } = require('gamedig');

import type { GportalServerConfig, LiveServerData } from './types.js';

/**
 * Führt einen Gamedig-Query aus.
 */
export async function queryServer(config: GportalServerConfig): Promise<LiveServerData | null> {
  if (!config.query) return null;

  try {
    const result = await query({
      type: config.type,
      host: config.host,
      port: config.queryPort,
    });

    return {
      name: result.name,
      map: result.map,
      players: result.players.length,
      maxPlayers: result.maxplayers,
      ping: result.ping,
    };
  } catch (err) {
    console.warn(`[Query] Server ${config.name} nicht erreichbar:`, err);
    return null;
  }
}
