// server.ts
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import handleStatsRequest from './api/stats/index.js'

// 🛰️ Bot-Client Zugriff (globalThis.discordClient wird vorausgesetzt)
import type { Client } from 'discord.js'

// Express-App erstellen
const app = express()

// __dirname erzeugen (für ESM-kompatibel)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🔓 Web-Ordner öffentlich bereitstellen
const publicPath = path.resolve(__dirname, 'web/pages')
app.use(express.static(publicPath))

// 📡 API-Route für /api/stats
app.get('/api/stats', (req, res) => {
  const client = globalThis.discordClient as Client
  return handleStatsRequest(req, res, client)
})

// 🚀 Server starten
const PORT = 3000
app.listen(PORT, () => {
  console.log(`🌐 Webserver läuft unter http://localhost:${PORT}`)
})
