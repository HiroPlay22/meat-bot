import Gamedig from 'gamedig';
import type { GportalServerConfig, LiveServerData } from './types.js';

export async function queryServer(config: GportalServerConfig): Promise<LiveServerData | null> {
  try {
    const result = await Gamedig.query({
      type: config.type,
      host: config.host,
      port: config.queryPort
    });

    return {
      serverName: result.name,
      map: result.map,
      players: result.players.length,
      maxPlayers: result.maxplayers,
      version: result.raw?.version ?? '',
      ping: result.ping
    };
  } catch (error) {
    console.warn(`[Query] Server ${config.name} nicht erreichbar:`, error);
    return null;
  }
}
