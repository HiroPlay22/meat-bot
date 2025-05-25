// api/stats/index.ts
import { getAllStats } from './getAllStats.js';
import type { Client } from 'discord.js';

export default async function handleStatsRequest(req, res, client: Client) {
  try {
    if (!client || !client.ws) {
      return res.status(503).json({ error: 'Bot-Client nicht bereit.' });
    }

    const data = await getAllStats(client);
    res.status(200).json(data);
  } catch (err) {
    console.error('[STATS API]', err);
    res.status(500).json({ error: 'Fehler beim Laden der Statistikdaten.' });
  }
}
