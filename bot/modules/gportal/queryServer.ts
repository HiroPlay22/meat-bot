// bot/modules/gportal/queryServer.ts

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const gamedig = require('gamedig'); // kann eine Funktion sein oder ein Objekt

import type { GportalServerConfig, LiveServerData } from './types.js';

/**
 * Führt einen Gamedig-Query aus.
 */
export async function queryServer(config: GportalServerConfig): Promise<LiveServerData | null> {
  if (!config.query) return null;

  try {
    const queryFn = typeof gamedig === 'function' ? gamedig : gamedig.query;

    const result = await queryFn({
      type: config.type,
      host: config.host,
      port: config.queryPort,
    });

    return {
      serverName: result.name ?? config.name,
      map: result.map,
      players: result.players.length,
      maxPlayers: result.maxplayers,
      ping: result.ping,
      version: result.raw?.version
    };
  } catch (err) {
    console.warn(`[Query] Server ${config.name} nicht erreichbar:`, err);
    return null;
  }
}
