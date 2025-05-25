// api/stats/index.ts
import { getAllStats } from './getAllStats.js'
import type { Client } from 'discord.js'

// Beispiel: Client wird beim Start global gespeichert
// z. B. in deinem Bot-Setup:
// globalThis.discordClient = client

export default async function handleStatsRequest(req, res) {
  try {
    const client: Client = globalThis.discordClient
    if (!client || !client.ws) {
      return res.status(503).json({ error: 'Bot-Client nicht bereit.' })
    }

    const data = await getAllStats(client)
    res.status(200).json(data)
  } catch (err) {
    console.error('[STATS API]', err)
    res.status(500).json({ error: 'Fehler beim Laden der Statistikdaten.' })
  }
}
